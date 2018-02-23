# getphpcscoverage

A cli tool which compares a dir with a phpcs config and reports files which are not checked.

## Install

`npm install -g @sirbrillig/getphpcscoverage`

## Usage

```
Usage
    $ getphpcscoverage [directoryPath]

  Specify a directory path which contains a phpcs.xml config file. This will
  report the files which will be scanned by the config file and those that will
  not.

  Options
    --help, -h  Show this help message
    --version, -v  Show the version
    --type <type>, -t <type>  Only examine files with this type extension (php, js, etc.)
    --format <format>, -f <format>  Set output type (human, json)
```

## Example

```
$ tree testdir

testdir
├── phpcs.xml
└── src
    ├── baz
    │   ├── index-2.js
    │   └── index.js
    └── foobar
        ├── index-2.js
        ├── index-3.js
        └── index.js

$ cat testdir/phpcs.xml

<?xml version="1.0"?>
<ruleset name="TestRules">
 <description>Test library.</description>
 <rule ref="MyRuleset"/>
 <file>src/foobar</file>
 <file>src/baz/index-2.js</file>
</ruleset>

$ getphpcscoverage testdir

These files WILL be scanned by phpcs:
testdir/src/foobar/index-2.js
testdir/src/foobar/index-3.js
testdir/src/foobar/index.js
testdir/src/baz/index-2.js

These files WILL NOT be scanned by phpcs:
testdir/src/baz/index.js
```
