import _ from 'lodash';
import Promise from 'bluebird';

import OS from 'os';
import IP from 'ip';
import NetScanner from 'evilscan';
const NetScannerPromise = ((options) => {
  return new Promise((resolve, reject) => {
    const result = [];
    const scanner = new NetScanner(options);
    scanner.on('error', reject);
    scanner.on('result', (data) => result.push(data));
    scanner.on('done', () => resolve(result));
    scanner.run();
  });
});

import ADB from 'adbkit';
import Client from 'adbkit/lib/adb/client';

const PORT_BASE = 15037;

const trackDevices = Client.prototype.trackDevices;
Client.prototype.trackDevices = function(callback) {
  this.trackClients = this.trackClients || {};
  return Promise.resolve().then(async () => {
    const tracker = await trackDevices.apply(this);
    const handler = async (network, port) => {
      const adb = this.trackClients[network.ip] = this.trackClients[network.ip] || ADB.createClient(port);
      return adb.connect(network.ip, network.port)
      .then((device) => tracker.emit('add', _.assign({ adb }, network, device)))
      .catch(()=>{})
    }
    const repeater = () => {
      const networks = _.reduce(OS.networkInterfaces(), (o, networks) => {
        const network = _.find(networks, { family: 'IPv4', internal: false });
        return network ? o.concat([`${network.address}/24`]) : o;
      }, []);
      Promise.map(networks, async (subnet) => {
        const devices = await NetScannerPromise({ target: subnet, port: '5555', status: 'O' });
        return Promise.map(devices, (device, offset) => {
          if(device.status == 'open') return handler(device, PORT_BASE + offset);
        });
      })
      .finally(() => setTimeout(repeater, 5000));
    }
    setTimeout(() => Promise.map(this.listDevices(), (device, offset) => handler(device, PORT_BASE + offset)).then(() => repeater()));
    return tracker;
  }).nodeify(callback);
}