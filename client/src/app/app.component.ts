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
    term.open(document.getElementById('terminal') as HTMLInputElement);
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
    })
    ws.addEventListener('message', (event) => {
      try {
        term.write(event.data);
      } catch (e) {
        console.error(e);
      }
    });

    term.onData((data) => ws.send(JSON.stringify({
      input: btoa(data),
    })));

    window.addEventListener('resize', () => {
      fitAddon.fit();
    });

    term.onResize((size) => {
      const terminal = document.getElementById('terminal');
      ws.send(JSON.stringify({
        cols: size.cols,
        rows: size.rows,
        x: terminal?.clientWidth,
        y: terminal?.clientHeight,
      }));
    });
  }
}
