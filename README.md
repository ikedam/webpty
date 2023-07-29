webpty demo
===========

This is a primitive web application providing bash console on web browsers like [Google Cloud Shell](https://cloud.google.com/shell) or [AWS Cloud Shell](https://docs.aws.amazon.com/cloudshell/latest/userguide/welcome.html).
This uses:

* [xterm.js](https://github.com/xtermjs/xterm.js/)
* Websocket communication
* [Echo](https://echo.labstack.com/)/Golang server running bash


Launch
------

```sh
docker compose up
```

Then, access http://localhost:4200/


LICENSE
-------

[MIT License](./LICENSE)
