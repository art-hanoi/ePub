const fs = require('fs');
const XML = require('fast-xml-parser');

if (process.argv.length != 3) { usage(); process.exit(1); }
var root = process.argv[2];

if (!fs.existsSync(root) || !fs.lstatSync(root).isDirectory()) error(root + ' is not a directory!');

const parser = new XML.XMLParser({ ignoreAttributes: false });
var fname, txt, xml, cont, subdir;
var item_by_id = {};
var item_by_url = {};
var all_files = {};

console.log('Validating mimetype ...');
const mimetype = 'application/epub+zip';
fname = root + '/mimetype';
txt = gettext(fname);
if (gettext(fname) != mimetype) error(fname + ': content must be "' + mimetype + '"');

console.log('Validating META-INF/container.xml ...');
fname = root + '/META-INF/container.xml';
xml = getxml(fname);
if (!xml.container) error(fname + ': missing XML tag container');
if (!xml.container.rootfiles) error(fname + ': missing XML tag container.rootfiles');
if (!xml.container.rootfiles.rootfile) error(fname + ': missing XML tag container.rootfiles.rootfile');
cont = xml.container.rootfiles.rootfile['@_full-path'];
if (!cont) error(fname + ': content file not specified');

console.log('Validating ' + cont + ' ...');
fname = root + '/' + cont;
subdir = cont.substr(0, cont.lastIndexOf('/') + 1);
xml = getxml(fname);
if (!xml.package) error(fname + ': missing XML tag package');
if (!xml.package.metadata) error(fname + ': missing XML tag package.metadata');
const dc = ['title', 'language', 'rights', 'creator', 'publisher', 'identifier'];
for (var tag of dc) {
  if (!xml.package.metadata['dc:' + tag]) error(fname + ': missing XML dc:' + tag);
  txt = xml.package.metadata['dc:' + tag];
  if (txt['#text']) txt = txt['#text'];
  console.log('    dc:' + tag + ': ', txt);
}
if (!xml.package.manifest) error(fname + ': missing XML tag package.manifest');
for (var item of xml.package.manifest.item) book_item(item);
if (!xml.package.spine) error(fname + ': missing XML tag package.spine');
collect(root);

var files = Object.keys(item_by_url).sort();
for (var f of files) if (!all_files[f]) error(fname + ': missing file ' + f);
files = Object.keys(all_files).sort();
for (var f of files) if (!item_by_url[f]) error(fname + ': unlisted file ' + f);

function collect(path) {
  var dir = fs.readdirSync(path);
  var name;
  for (var file of dir) {
    name = path + '/' + file;
    if (fs.lstatSync(name).isDirectory()) {
      collect(name);
    }
    else {
      name = name.substr(root.length + 1);
      if (name == 'mimetype' || name == 'META-INF/container.xml' || name == cont) continue;
        all_files[name] = true;
    }
  }
}
function book_item(item) {
  if (item_by_id[item['@_id']]) error(fname + ': duplicated ID ' + item['@_id']);
  item_by_id[item['@_id']] = item;
  if (item_by_url[subdir + item['@_href']]) error(fname + ': duplicated URL ' + item['@_href']);
  item_by_url[subdir + item['@_href']] = item;
}
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
  console.log('USAGE: ' + process.argv[1].split(/[\\\/]+/).slice(-1)[0] + ' <directory>');
}
