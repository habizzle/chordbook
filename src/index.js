import {start} from './RestController.js';

const port = process.env.PORT ?? 8080;
start(port);