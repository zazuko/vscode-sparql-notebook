# Change Log

All notable changes to the "vscode-sparql-notebook" extension will be documented in this file.
##  0.0.18

Updated webpack build to improve performance and reduce file size

Added support for Visual Studio Code version 1.77

Minor bug fixes and improvements 

##  0.0.17

Format *.sparqlnotebook files to improve version control. 

##  0.0.16

Feature: Initial support for abort query.

Improve error handling

##  0.0.15

Fix: SELECT result first column CSS

## 0.0.14

Fix: Error handling.

Special Thanks: Vojtěch Musílek

## 0.0.13

Fix: ASK query with 'sparqlbook.useNamespaces' true.

## 0.0.12

Fix: Query POST created invalid route for this sparql database: Oxigraph. Remove tailoring '/' from the endpoint.

Feature: SPARQL SELECT results uses now prefixes from the query. You can disable this behaviour with the setting 'sparqlbook.useNamespaces'.

Special Thanks: Vojtěch Musílek, Ivo Velitchkov

## 0.0.11

Feature: New `application/sparql-results+json` renderer with dark and light mode support.

Feature: Export Notebook as Markdown.

## 0.0.10

Feature: Configure endpoint per cell. Add a comment like `# [ednpoint=http://....]` to your SPARQL Query.

Feature: New rendering for TTL ouput

## 0.0.9

Fix: content type with charset `application/sparql-results+json;charset=utf-8` not recognised

## 0.0.8

Update description

## 0.0.7

Initial release!
