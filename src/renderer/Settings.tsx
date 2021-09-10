import { Button } from '@material-ui/core';
import React, { SyntheticEvent } from 'react';
import { WindowImagetter } from '../../vendor/tribe-logger-lib/dist/index';
import IPCUtilities from './ipc';
import { TRIBELOGGER_AREA_KEY } from '../common/Schema';

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

  #ipc: IPCUtilities;

  #canvas: React.RefObject<HTMLCanvasElement>;

  #isBound = false;

  constructor(props: unknown) {
    super(props);
    // Bind function to 'this'
    this.UpdateImageBitmap = this.UpdateImageBitmap.bind(this);
    this.BindForCanvasSelection = this.BindForCanvasSelection.bind(this);
    this.UnbindForCanvasSelection = this.UnbindForCanvasSelection.bind(this);
    this.OnMouseMove = this.OnMouseMove.bind(this);
    this.SaveAreaPref = this.SaveAreaPref.bind(this);
    this.GetAreaPref = this.GetAreaPref.bind(this);
    this.UpdateSelectionRect = this.UpdateSelectionRect.bind(this);
    this.UpdateSelection = this.UpdateSelection.bind(this);

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

    this.UpdateImageBitmap();
  }

  /**
   * Updates the selection fields.
   * @param area rectangle representing the area of the selection.
   * @returns Will return void if area was null.
   */
  UpdateSelectionRect(area: WindowImagetter.Area): void {
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
  async UpdateImageBitmap(): Promise<void> {
    const { ErrorCode, BitmapBuffer, Width, Height } =
      await this.#ipc.getWindowBitmap('ARK: Survival Evolved');

    // Error, in the future provide better error messages
    if (ErrorCode !== 0) {
      return;
    }

    // Create image data structure from buffer
    const imageData = new ImageData(
      new Uint8ClampedArray(BitmapBuffer),
      Width,
      Height
    );

    if (
      Width !== this.#canvas.current.width ||
      Height !== this.#canvas.current.height
    ) {
      this.#canvas.current.width = Width;
      this.#canvas.current.height = Height;
    }

    // Cleanup existing bitmap if it exist
    if (this.#imageBitmap != null) this.#imageBitmap.close();
    this.#imageBitmap = await createImageBitmap(imageData);
    const ctx: CanvasRenderingContext2D = this.#canvas.current.getContext('2d');
    ctx.clearRect(0, 0, Width, Height);
    this.DrawBitmapImage(ctx);
    if (this.#selectionWidth > 0 && this.#selectionHeight > 0) {
      this.DrawSelection(ctx);
    }
  }

  /**
   * Draws the selection rectangle to the canvas.
   */
  DrawSelection(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#22AA2255';
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
    const area: WindowImagetter.Area = {
      left: this.#selectionLeft,
      top: this.#selectionTop,
      width: this.#selectionWidth,
      height: this.#selectionHeight,
    };

    // Set preferences on save
    this.#ipc.setPref(TRIBELOGGER_AREA_KEY, area);
    // Update the actual in-memory tribe-logger instance
    this.#ipc.updateTribeLogger('area', area);
  }

  async GetAreaPref(): Promise<void> {
    const area: WindowImagetter.Area = (await this.#ipc.getPref(
      TRIBELOGGER_AREA_KEY
    )) as WindowImagetter.Area;
    // console.log(area);
    this.UpdateSelectionRect(area);
  }

  /**
   * Updates the selection rectangle when it is invalidated
   * while also making sure to re-draw other present visuals.
   */
  UpdateSelection(): void {
    const ctx: CanvasRenderingContext2D = this.#canvas.current.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (this.#imageBitmap != null) {
      this.DrawBitmapImage(ctx);
    }
    this.DrawSelection(ctx);
  }

  render() {
    return (
      <div>
        {/* <Paper>
          <Typography>Here you can adjust your settings.</Typography>
        </Paper> */}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <Button onClick={this.SaveAreaPref} varient="contained" color="primary">
          Save
        </Button>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <Button
          onClick={this.UpdateImageBitmap}
          varient="contained"
          color="secondary"
        >
          Get Window Image
        </Button>
        {/* <Button>
          Get Tribe Log
        </Button> */}
        {/* <button type="button" onClick={this.GetAreaPref}>
          Get Pref Test
        </button> */}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <Button onClick={this.ClearPrefs} varient="contained" color="secondary">
          Clear
        </Button>
        <canvas
          id="myCanvas"
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
