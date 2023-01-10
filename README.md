# chordbook

1. Install with `npm install`

2. Run web ui with `npm start`

3. Open http://localhost:8080 in your browser

All song books in `books/` will be parsed by default. Song books ending with `.private.yml` will be excluded from source control.
The path for loading books can be configured with environment variable `BOOKS_PATH`.

The port for the web server can be configured with environment variable `PORT`. The default is `8080`.

