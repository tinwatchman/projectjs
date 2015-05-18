# project.js Command Documentation

## Table of Contents
* [rm-alias](#rm-alias)
  * [Example](#rm-alias-example)
  * [Options](#rm-alias-options)
* [rmclass](#rmclass)
  * [Example](#rmclass-example)
  * [Options](#rmclass-options)

You can also access documentation by entering `projectjs -h` into the command line.

---

### rm-alias
<a name="rm-alias-example"></a>
#### Example
```shell
projectjs rm-alias Application
```
<a name="rm-alias-options"></a>
#### Options
* `--alias`, `-a`: Name of alias to remove. Required.
* `--force`, `-f`: Force remove without asking for confirmation


---

### rmclass
<a name="rmclass-example"></a>
#### Example
```shell
projectjs rmclass my.project.ClassName
```
<a name="rmclass-options"></a>
#### Options
* `--name`, `-n`: Full name of class to remove. Required.
* `--force`, `-f`: Force remove without asking for confirmation
* `--cache`, `-c`: Retain class file on disk


---