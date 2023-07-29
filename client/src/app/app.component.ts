import { Component, OnInit } from '@angular/core';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  ngOnInit() {
    const term = new Terminal({
      cols: 80,
      rows: 24,
      allowProposedApi: false,
    });
    const terminal = document.getElementById('terminal');
    if (!terminal) {
      console.log('failed to detect #terminal');
      return;
    }

    term.open(terminal);
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    const ws = new WebSocket(`ws://${window.location.host}/api/terminal`);

    ws.addEventListener('open', () => {
      fitAddon.fit();
    });
    ws.addEventListener('error', (event) => {
      console.log('Websocket disconnected with error: %o', event);
    })
    ws.addEventListener('close', (event) => {
      console.log('Websocket disconnected: %o', event);
      term.write('\r\n\x1B[31m\x1B[1m[DISCONNECTED]\x1B[0m\r\n');
    })
    ws.addEventListener('message', (event) => {
      try {
        term.write(event.data);
      } catch (e) {
        console.error('error while writing to xtermjs: %o', e);
      }
    });

    term.onData((data) => {
      try {
        ws.send(JSON.stringify({
          input: btoa(data),
        }));
      } catch (e) {
        console.error('error while sending to server: %o', e);
      }
    });

    window.addEventListener('resize', () => {
      fitAddon.fit();
    });

    term.onResize((size) => {
      const terminal = document.getElementById('terminal');
      if (!terminal) {
        console.log('failed to detect #terminal');
        return;
      }
        ws.send(JSON.stringify({
        cols: size.cols,
        rows: size.rows,
        x: terminal.clientWidth,
        y: terminal.clientHeight,
      }));
    });
  }
}
