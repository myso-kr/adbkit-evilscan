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

import Client from 'adbkit/lib/adb/client';
const trackDevices = Client.prototype.trackDevices;
Client.prototype.trackDevices = function(callback) {
  return Promise.resolve().then(async () => {
    const tracker = await trackDevices.apply(this);
    const repeater = () => {
      const networks = _.reduce(OS.networkInterfaces(), (o, networks) => {
        const network = _.find(networks, { family: 'IPv4', internal: false });
        return network ? o.concat([`${network.address}/24`]) : o;
      }, []);
      Promise.map(networks, async (subnet) => {
        const devices = await NetScannerPromise({ target: subnet, port: '5555', status: 'O' });
        return Promise.map(devices, (device) => {
          console.log(device);
          // _.isPlainObject(device) && this.connect(device.ip, device.port).catch(()=>{})
        });
      })
      .finally(() => setTimeout(repeater, 5000));
    }
    setTimeout(() => Promise.map(this.listDevices(), (device) => tracker.emit('add', device)).then(() => repeater()));
    return tracker;
  }).nodeify(callback);
}