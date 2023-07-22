package main

import (
	"encoding/json"
	"errors"
	"io"
	"os/exec"

	"github.com/creack/pty"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echolog "github.com/labstack/gommon/log"
	"golang.org/x/net/websocket"
)

type commandData struct {
	Input   []byte `json:"input,omitempty"`
	PtySize *struct {
		Cols int `json:"cols"`
		Rows int `json:"rows"`
		X    int `json:"x"`
		Y    int `json:"y"`
	} `json:"ptySize,omitempty"`
}

func doTerminal(c echo.Context) error {
	c.Logger().Info("new connection")
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()
		err := func() error {
			cmd := exec.Command("bash")
			ptmx, err := pty.Start(cmd)
			if err != nil {
				return err
			}
			defer func() { _ = ptmx.Close() }()

			err = pty.Setsize(ptmx, &pty.Winsize{
				Cols: 80,
				Rows: 24,
				X:    1024,
				Y:    768,
			})
			if err != nil {
				return err
			}

			go func() {
				for {
					var buf []byte
					err := websocket.Message.Receive(ws, &buf)
					if err != nil {
						if errors.Is(err, io.EOF) {
							c.Logger().Info("EOF")
							cmd.Process.Kill()
							return
						}
						c.Logger().Warnf("Error while reading from client: %+v", err)
						continue
					}
					var command commandData
					err = json.Unmarshal(buf, &command)
					if err != nil {
						c.Logger().Warnf("Unexpected command from client %s: %+v", buf, err)
						continue
					}
					if command.Input != nil {
						_, err = ptmx.Write(command.Input)
						if err != nil {
							c.Logger().Errorf("Error while writing to terminal: %+v", err)
						}
					}
					if command.PtySize != nil {
						c.Logger().Info("Change terminal size: %#v", *command.PtySize)
						err = pty.Setsize(ptmx, &pty.Winsize{
							Cols: uint16(command.PtySize.Cols),
							Rows: uint16(command.PtySize.Rows),
							X:    uint16(command.PtySize.X),
							Y:    uint16(command.PtySize.Y),
						})
						if err != nil {
							c.Logger().Errorf("Error while setting terminal size: %+v", err)
						}
					}
				}
			}()
			_, _ = io.Copy(ws, ptmx)
			return nil
		}()
		if err != nil {
			c.Logger().Error(err)
		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}

func main() {
	e := echo.New()
	e.Logger.SetLevel(echolog.DEBUG)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.GET("/api/terminal", doTerminal)
	e.Logger.Fatal(e.Start(":8080"))
}
