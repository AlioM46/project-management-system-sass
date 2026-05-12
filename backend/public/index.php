<?php

// starter point, runs each request
// called by web server (Apache, Nginx)
// 1 - Handle the classes paths
// 2 - handle app configurations 


// Nginx/Apache
//   calls → public/index.php

// public/index.php
//   requires → vendor/autoload.php
//   requires → bootstrap/app.php

// bootstrap/app.php
//   creates → Laravel Application

// Application
//   later handles → Request

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));



// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__ . '/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
// -> Load Classes Paths (namespaces, so it can know what -
// is "projectsController" and where is it)

//What line makes Laravel and app classes available?

//It maps class names/namespaces to actual 
// PHP files so PHP can load classes when needed.
require __DIR__ . '/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
// configure the app e.g. -> apis, web, console cmds.
// middlewares etc...

//What line loads/configures the Laravel application?
$app = require_once __DIR__ . '/../bootstrap/app.php';

$app->handleRequest(Request::capture());
