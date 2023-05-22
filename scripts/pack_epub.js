const fs = require('fs');
const AZ = require('adm-zip');

if (process.argv.length != 4) { usage(); process.exit(1); }
var root = process.argv[2];
var out = process.argv[3];
if (out.substr(-5).toLowerCase() != '.epub') out += '.epub';

console.log(root, '=>', out);

var zip = new AZ(__dirname + '/mimetype.zip');

var dir = fs.readdirSync(root);
for (var name of dir) {
  if (fs.lstatSync(root + '/' + name).isDirectory()) {
    zip.addLocalFolder(root + '/' + name, name);
  }
  else if (name != 'mimetype') {
    zip.addLocalFile(root + '/' + name);
  }
}
zip.writeZip(out);

function usage() {
  console.log('USAGE: ' + process.argv[1].split(/[\\\/]+/).slice(-1)[0] + ' <directory> <output.epub>');
}
