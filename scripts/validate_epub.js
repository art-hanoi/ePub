const fs = require('fs');
const XML = require('fast-xml-parser');

var root = process.argv[2];

if (!fs.existsSync(root) || !fs.lstatSync(root).isDirectory()) error(root + ' is not a directory!');

const parser = new XML.XMLParser({ ignoreAttributes: false });
var fname, txt, xml, cont;

console.log('Validating mimetype ...');
const mimetype = 'application/epub+zip';
fname = root + '/mimetype';
txt = gettext(fname);
if (gettext(fname) != mimetype) error(fname + ' content must be "' + mimetype + '"');

console.log('Validating META-INF/container.xml ...');
fname = root + '/META-INF/container.xml';
xml = getxml(fname);
if (!xml.container) error(fname + ' missing XML tag: container');
if (!xml.container.rootfiles) error(fname + ' missing XML tag: container.rootfiles');
if (!xml.container.rootfiles.rootfile) error(fname + ' missing XML tag: container.rootfiles.rootfile');
cont = xml.container.rootfiles.rootfile['@_full-path'];
if (!cont) error(fname + ' content file not specified');

console.log('Validating ' + cont + ' ...');
fname = root + '/' + cont;
xml = getxml(fname);

console.log(xml);

function getxml(fname) {
  var txt = gettext(fname);
  var err = XML.XMLValidator.validate(txt).err;
  if (err) error('XML error: ' + fname + '#' + err.line + ':' + err.col + ' ' + err.msg);
  return parser.parse(txt);
}
function gettext(fname) {
  if (!fs.existsSync(fname) || !fs.lstatSync(fname).isFile()) error('File not found: ' + fname);
  return fs.readFileSync(fname, 'utf8');
}
function error(s) {
  console.log(s);
  process.exit(1);
}
function usage() {
  console.log('USAGE: validate_epub.js <directory>');
}
