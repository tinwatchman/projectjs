# project.js
> Bringing Javaish project structure and organization to civilize your Node apps

Tired of hunting down where you put a class? Drained by figuring out relative paths for your require statements? On the verge of despair from writing the same boilerplate code over and over again? Do you -- in short -- find yourself missing the more structured development environment provided by other languages, where each class has its own file and namespaces make imports a breeze?

Enter **Project.js**. Project.js is a simple collection of command-line tools intended to make Node development both easier and more organized. It works by placing a *project.json* file at the root of your project's directory, which tracks your .js files and maps them to a set of namespaced strings, similar to how languages like Java and Visual C# organize their classes. When you're finished developing, just type in `projectjs build` to your terminal. Your project will be automatically compiled with all import statements subbed out for standard Node requires.

**Please note that this project is very much currently in development! It is by no means ready for production at this time! Use at your own risk!**


## Getting Started

To install project.js globally, run the following from the command line:

```shell
npm install -g projectjs
```


### Creating a project

To create a project, navigate to the directory you wish to work within (i.e. the same directory that your *package.json* file would be kept in). Before you begin, you will need to decide on a **base namespace** for your project. This is a unique name that serves to distinguish the project's code from that of others. For example: *net.jonstout.myprojectname*. Once you have decided, enter this into the command line:

```shell
projectjs init --nm your.namespace.here
```

You will be prompted to name your project's source and build folders. (The *source folder* is the directory in which Project.js will expect your code to be stored. The *build folder* is where your project will be compiled to.) Leave the prompts blank to default to `src` and `build`, respectively.

A new *project.json* file will be created in the root project directory.


### The project.json file

The content of your project.json file will look something like this:

```json
{
    "namespace": {
        "base": "my.sample.project",
        "map": {},
        "dependencies": {},
        "aliases": {}
    },
    "srcDir": "./src",
    "buildDir": "./build",
    "start": "",
    "schema": {
        "name": "projectjs",
        "version": "0.0.3"
    }
}
```

The heart of project.js is the *map* property. As you add classes, the project.json file will be used to track your class names and their file paths. This will allow you to import classes via their names rather than their file paths.


### The use function

Within class files and scripts managed by ProjectJs, you will have access to the *use* function. The use function allows you to import classes and objects via namespace reference. For instance:

```javascript
/* use import example */
var MyClass = use('my.project.MyClass');
```

(Why *use*? Because it's not a reserved ECMAScript keyword, it's reminiscent of C#'s *using* keyword, and it's only three letters long.)

You can still use standard Node require statements and npm imports in your code without any conflict:

```javascript
var MyClass = use('my.project.MyClass');
var path = require('path');
```

When you build a project, the use statements are automatically replaced with requires. All file paths are automatically managed by the compiler.


### Creating a new class

Navigate into your source directory if you have one. To create a new class, enter this into the command line:

```shell
projectjs newclass --n YourClassName
```

You should see something like this printed in response:

```shell
> Class your.namespace.YourClassName created!
```

You will see a new JavaScript file with the class' name in your current directory. Its contents will look something like this:

```javascript
/* projectjs name: my.namespace.MyClassName */
/* imports */

/* end imports */

var MyClassName = function() {

};
MyClassName.prototype = {
};
```

No other code is required. All additional boilerplate will be added at compile-time.

In project.js, there is **only one class per file.** This ensures that code is easy to find and maintain. Please note that *only* the object with the class' name will be visible outside of the file. Any other objects or classes declared within the file will be "private," unless exposed through the main class.

If you open the project.json file, you'll notice that it now looks something like this:

```json 
{
    "namespace": {
        "base": "my.namespace",
        "map": {
            "my.namespace.MyClassName": "./MyClassName"
```

You can now import this class in other project files by calling `use('my.namespace.MyClassName')`.


### Setting the project start point

You will also need to set a *start point* (or *entry point*) for your project. This represents the code that should be executed first when the project runs. There are two ways to do so:

#### Option 1: Set a starting script file

First, you can simply set a particular script file to be run in order to start up the project. To do so, enter the following into the command line:

```shell
projectjs set-start --use-script --file ./path/to/your/scriptfile.js
```

Your project.json should now contain something like the following:

```json
    "start": "./path/to/your/scriptfile.js",
```

#### Option 2: Set a starting class method

Second, you can take a more object-oriented approach and name a starting class and method to invoke at startup. If you choose this option, project.js will automatically generate a starting script that will import the class you specify, instantiate it, and call one of its methods.

You can do so by putting something like the following into your command line:

```shell
projectjs set-start --class your.project.StartingClass --method yourStartMethod --output ./path/to/yourstartscript.js
```

Your project.json file should now contain an entry like this:

```json
    "start": {
        "class": "your.project.StartingClass",
        "method": "yourStartMethod",
        "output": "./path/to/yourstartscript.js"
    },
```

When you build your project (see [below](#build_project)), you should find a new script at the path you specified as your `output` parameter. (This script should most likely be the file named in the `"main"` property inside the project's package.json file.) Its contents will look something like this:

```javascript
/* Generated by ProjectJs v0.0.3 */
var StartingClass = require('./path/to/your/class');
var startingClass = new StartingClass();
startingClass.yourStartMethod();
```


### Running the project

To compile and run the project, simply enter this command from anywhere within the project directory structure:

```shell
projectjs run
```

<a name="build_project"></a>
### Building the project

To run a build, enter this at the command line:

```shell
projectjs build
```

As has been mentioned, building the project will compile and output it in a form that can be processed without project.js. All `use` statements will be removed and replaced with standard `require` imports.

## Features

* Keeps projects organized with separate files for each class and simple namespacing to make imports easy.
* Project-specific aliases for classes
* Command-line tools to speed up creating class files
* Compiler wraps classes in boilerplate code so you don't have to
* More details soon!

## To Do List

* (More and better) documentation
* More test coverage
* Test on Windows
* Figure out how to handle dependencies / if they're even necessary
* Figure out if source and build folders should really be mandatory
* `refactor` / `rename-class` command
* `rm-class` command
* Grunt plugin
* Gulp plugin (?)

## Documentation

... is better, yes? Still working on it.

## Credits

Created by [Jon Stout](http://www.jonstout.net). Licensed under [the MIT license](http://opensource.org/licenses/MIT).