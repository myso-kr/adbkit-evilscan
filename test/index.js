import adb from 'adbkit';
import '../lib/adbkit-evilscan';

var client = adb.createClient()

client.trackDevices()
.then(function(tracker) {
  tracker.on('add', function(device) {
    console.log('Device %s was plugged in', device.id)
  })
  tracker.on('remove', function(device) {
    console.log('Device %s was unplugged', device.id)
  })
  tracker.on('end', function() {
    console.log('Tracking stopped')
  })
})
.catch(function(err) {
  console.error('Something went wrong:', err.stack)
})