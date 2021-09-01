import React, { SyntheticEvent } from 'react';
// import {
//   WindowImgetter,
//   WinImgGetError,
// } from '../../vendor/tribe-logger-lib/dist';
import IPCSettings, { Area } from './ipc';

export interface BitmapResult {
  ErrorCode: number;
  BitmapBuffer: ArrayBuffer;
}

export default class Settings extends React.Component {
  #selectionLeft = 0;

  #selectionTop = 0;

  #selectionWidth = 0;

  #selectionHeight = 0;

  #imageBitmap: ImageBitmap;

  #ipc: IPCSettings;

  #canvas: React.RefObject<HTMLCanvasElement>;

  #isBound = false;

  constructor(props: unknown) {
    super(props);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.#ipc = window.electron.ipcRenderer;

    // eslint-disable-next-line promise/always-return
    this.GetAreaPref()
      .then(this.UpdateSelection)
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.log(error);
      });

    this.#canvas = React.createRef();

    // Bind function to 'this'
    this.OnUpdateImageBitmap = this.OnUpdateImageBitmap.bind(this);
    this.BindForCanvasSelection = this.BindForCanvasSelection.bind(this);
    this.UnbindForCanvasSelection = this.UnbindForCanvasSelection.bind(this);
    this.OnMouseMove = this.OnMouseMove.bind(this);
    this.SaveAreaPref = this.SaveAreaPref.bind(this);
    this.GetAreaPref = this.GetAreaPref.bind(this);
  }

  /**
   * Updates the selection fields.
   * @param area rectangle representing the area of the selection.
   * @returns Will return void if area was null.
   */
  UpdateSelectionRect(area: Area): void {
    if (area == null) return;
    this.#selectionLeft = area.left;
    this.#selectionTop = area.top;
    this.#selectionWidth = area.width;
    this.#selectionHeight = area.height;
    this.UpdateSelection();
  }

  /**
   * Updates the image bitmap when it is invalidated
   * while also making sure to re-draw other present visuals.
   */
  OnUpdateImageBitmap(): void {
    this.UpdateImageBitmap();
  }

  async UpdateImageBitmap(): Promise<void> {
    const { ErrorCode, BitmapBuffer } = await this.#ipc.getWindowBitmap(
      'ARK: Survival Evolved'
    );

    // Error, in the future provide better error messages
    if (ErrorCode !== 0) {
      return;
    }

    // Create image data structure from buffer
    const imageData = new ImageData(
      new Uint8ClampedArray(BitmapBuffer),
      640,
      480
    );

    // Cleanup existing bitmap if it exist
    if (this.#imageBitmap != null) this.#imageBitmap.close();
    this.#imageBitmap = await createImageBitmap(imageData);
    const ctx: CanvasRenderingContext2D = this.#canvas.current.getContext('2d');
    ctx.clearRect(0, 0, 640, 480);
    this.DrawBitmapImage(ctx);
    if (this.#selectionWidth > 0 && this.#selectionHeight > 0) {
      this.DrawSelection(ctx);
    }
  }

  /**
   * Draws the selection rectangle to the canvas.
   */
  DrawSelection(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#22AA2266';
    // eslint-disable-next-line prettier/prettier
    // console.log(`Left: ${this.#selectionLeft} Top: ${this.#selectionTop} Width: ${this.#selectionWidth} Height: ${this.#selectionHeight}`);
    ctx.fillRect(
      this.#selectionLeft,
      this.#selectionTop,
      this.#selectionWidth,
      this.#selectionHeight
    );
  }

  /**
   * Draws the bitmapimage to the canvas properly.
   */
  DrawBitmapImage(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(
      this.#canvas.current.width / 2,
      this.#canvas.current.height / 2
    ); // center img
    ctx.rotate((180 * Math.PI) / 180); // rotate
    ctx.scale(-1, 1);
    ctx.drawImage(
      this.#imageBitmap,
      -this.#imageBitmap.width / 2,
      -this.#imageBitmap.height / 2
    );
    ctx.restore();
  }

  /**
   * Binds event handlers to canvas events.
   */
  BindForCanvasSelection(e: SyntheticEvent<MouseEvent>): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.#selectionLeft = e.nativeEvent.offsetX;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.#selectionTop = e.nativeEvent.offsetY;
    this.#canvas.current.addEventListener('mousemove', this.OnMouseMove);
    this.#isBound = true;
  }

  /**
   * Unbinds event handlers from canvas events, checks to make sure they are not already unbound.
   * After the unbinding, isBound is set to false.
   */
  UnbindForCanvasSelection(): void {
    /**
     * If a user leaves while mouse down and then returns and triggers a mouseup, the canvas this will be called.
     * This is a problem because things are already unbind when they left the canvas with the mousedown, therefore
     * use the boolean to ignore.
     */

    if (!this.#isBound) return;
    // eslint-disable-next-line no-console
    console.log('Unbinding canvas selection event handlers.');
    this.#canvas.current.removeEventListener('mousemove', this.OnMouseMove);
    this.#isBound = false;
  }

  /**
   *
   * @param ev Mouse event info
   */
  OnMouseMove(ev: MouseEvent): void {
    // console.log('Mouse Moving!');
    // console.log(ev.clientX + " | " + ev.clientY);
    // Update width / height from move
    this.#selectionWidth = ev.offsetX - this.#selectionLeft;
    this.#selectionHeight = ev.offsetY - this.#selectionTop;
    this.UpdateSelection();
  }

  SaveAreaPref(): void {
    const area: Area = {
      left: this.#selectionLeft,
      top: this.#selectionTop,
      width: this.#selectionWidth,
      height: this.#selectionHeight,
    };

    // Set preferences on save
    this.#ipc.setAreaPref('area', area);
  }

  async GetAreaPref(): Promise<void> {
    const area = await this.#ipc.getAreaPref('area');
    console.log(area);
    this.UpdateSelectionRect(area);
  }

  /**
   * If the user leaves the canvas while their mouse is down, unbind event handlers
   * @param ev Mouse event info
   */
  // OnMouseLeave(): void {
  //   this.UnbindForCanvasSelection();
  // }

  /**
   * Updates the selection rectangle when it is invalidated
   * while also making sure to re-draw other present visuals.
   */
  UpdateSelection(): void {
    const ctx: CanvasRenderingContext2D = this.#canvas.current.getContext('2d');
    ctx.clearRect(0, 0, 640, 480);
    if (this.#imageBitmap != null) {
      this.DrawBitmapImage(ctx);
    }
    this.DrawSelection(ctx);
  }

  render() {
    return (
      <div>
        <h1>Hello World!</h1>.
        <button type="button" onClick={this.OnUpdateImageBitmap}>
          Test GetWindowBitmap()
        </button>
        <button type="button" id="getTribeLogBtn">
          Test GetTribeLogText()
        </button>
        <button type="button" onClick={this.SaveAreaPref}>
          Save
        </button>
        <button type="button" onClick={this.GetAreaPref}>
          Get
        </button>
        <button type="button" id="clearPrefs">
          Clear Your Preferences
        </button>
        <p id="testPref">text</p>
        <button type="button" id="settingsBtn">
          Settings
        </button>
        <canvas
          id="myCanvas"
          width="640px"
          height="480px"
          ref={this.#canvas}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onMouseDown={this.BindForCanvasSelection}
          onMouseUp={this.UnbindForCanvasSelection}
          onMouseLeave={this.UnbindForCanvasSelection}
        />
      </div>
    );
  }
}
