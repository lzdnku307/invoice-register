/**
 * Created by lizude on 16/9/21.
 */
if(process.argv[2] === 'sync') {
  require('./src/common/sync');
} else {
  require('./src/common/server');
}