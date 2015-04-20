# project.js
> Bringing Javaish project structure and organization to civilize your Node apps

Tired of hunting down where you put a class inside of a set of endless .js files? Drained by figuring out relative paths for your require statements? On the verge of despair from writing the same boilerplate code over and over again? Do you -- in short -- find yourself missing the more structured development environment provided by other languages, where each class has its own file and namespaces make imports a breeze?

Enter **Project.js**. Project.js is a simple collection of command-line tools intended to make Node development both easier and more organized. It works by placing a *project.json* file at the root of your project's directory, which tracks your .js files and maps them to a set of namespaced strings, similar to how languages like Java and Visual C# organize their classes. When you're finished developing, just type in `projectjs build` to your terminal. Your project will be automatically compiled with all import statements subbed out for standard Node requires.

**Please note that this project is very much currently in development! It is by no means ready for production at this time! Use at your own risk!**

## Features

* Keeps projects organized with separate files for each class and simple namespacing to make imports easy.
* Project-specific aliases for classes
* Dependency tracking
* Command-line tools to speed up creating class files
* Compiler wraps classes in boilerplate code so you don't have to
* More details soon!

## Documentation

... is coming. I promise.

## Credits

Created by [Jon Stout](http://www.jonstout.net). Licensed under [the MIT license](http://opensource.org/licenses/MIT).