module.exports = function(grunt) {
    'use strict';
    function loadDependencies(deps) {
        if (deps) {
            for (var key in deps) {
                if (key.indexOf("grunt-") == 0) {
                    grunt.loadNpmTasks(key);
                }
            }
        }
    }
 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            js: "public/javascripts/bookstore.js"
        },
        copy: {
            test: {
                files: [{
                    expand: true,
                    cwd: "bower_components/mocha",
                    src: "mocha.*",
                    dest: "public/test"
                },
                {
                    expand: true,
                    cwd: "bower_components/chai",
                    src: "chai.js",
                    dest: "public/test"
                }]
            }
        },

        concat: {
            dist : {
                src : [
                    "grunt-src/scripts/intro.txt",
                    "grunt-src/scripts/main.js",
                    "grunt-src/scripts/outro.txt"
                ],
                dest: "public/javascripts/bookstore.js"
            }
        },

        uglify: {
            build: {
                files: [{
                    "public/javascripts/bookstore.min.js": "public/javascripts/bookstore.js"
                }]
            }
        },

        jshint : {
            all : ['grunt-src/scripts/*.js']
        },
        
        watch: {
            scripts: {
                files: [
                    'grunt-src/scripts/*.js'
                ],
                tasks: ['jshint', 'concat', 'uglify'],
                options: {
                    livereload: true
                }
            }
        }
    });
 
    loadDependencies(grunt.config("pkg").devDependencies);

    grunt.registerTask('default', [ 'jshint', 'concat', 'uglify']);
    grunt.registerTask('heroku', [ 'concat', 'uglify']);

};