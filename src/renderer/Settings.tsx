import { Button, Typography } from '@material-ui/core';
import React, { SyntheticEvent } from 'react';
import IPCUtilities from './ipc';
import { TRIBELOGGER_LOGSELECTION_KEY, LogSelection } from '../common/Schema';

export interface BitmapResult {
  ErrorCode: number;
  BitmapBuffer: ArrayBuffer;
}

const SUCCESS_CODE = 0;
const DESIRED_WIDTH = 700;

export default class Settings extends React.Component {
  #logSelection: LogSelection;

  #imageBitmap: ImageBitmap;

  #ipc: IPCUtilities;

  #canvas: React.RefObject<HTMLCanvasElement>;

  #isBound = false;

  #scaleFactor: number;

  constructor(props: unknown) {
    super(props);
    // Bind function to 'this'
    this.UpdateImageBitmap = this.UpdateImageBitmap.bind(this);
    this.BindForCanvasSelection = this.BindForCanvasSelection.bind(this);
    this.UnbindForCanvasSelection = this.UnbindForCanvasSelection.bind(this);
    this.OnMouseMove = this.OnMouseMove.bind(this);
    this.SaveAreaPref = this.SaveAreaPref.bind(this);
    // this.GetAreaPref = this.GetAreaPref.bind(this);
    this.UpdateSelectionRect = this.UpdateSelectionRect.bind(this);
    this.UpdateSelection = this.UpdateSelection.bind(this);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.#ipc = window.electron.ipcRenderer;

    // eslint-disable-next-line promise/always-return
    // this.GetAreaPref()
    //   .then(())
    //   .catch((error: unknown) => {
    //     // eslint-disable-next-line no-console
    //     console.log(error);
    //   });

    (async () => {
      this.#logSelection = (await this.#ipc.getPref(
        TRIBELOGGER_LOGSELECTION_KEY
      )) as LogSelection;
      if (
        this.#logSelection === null ||
        typeof this.#logSelection === 'undefined'
      ) {
        this.#logSelection = {
          name: 'default',
          baseImageRect: {
            height: 0,
            width: 0,
          },
          selectionRect: {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
          },
        };
        console.log(this.#logSelection);
        return;
      }
      console.log(this.#logSelection);
      this.UpdateImageBitmap();
    })();

    this.#canvas = React.createRef();
  }

  /**
   * Updates the selection fields.
   * @param area rectangle representing the area of the selection.
   * @returns Will return void if area was null.
   */
  UpdateSelectionRect(logSelection: LogSelection): void {
    if (logSelection == null) return;
    this.#logSelection = logSelection;
    this.UpdateSelection();
  }

  /**
   * Updates the image bitmap when it is invalidated
   * while also making sure to re-draw other present visuals.
   */
  async UpdateImageBitmap(): Promise<void> {
    const result = await this.#ipc.getWindowBitmap('ARK: Survival Evolved');
    // An error occured so do not draw
    if (result.ErrorCode !== SUCCESS_CODE) {
      return;
    }

    const { Width, Height, BitmapBuffer } = result;

    // Create image data structure from buffer
    const imageData = new ImageData(
      new Uint8ClampedArray(BitmapBuffer),
      Width,
      Height
    );

    this.#scaleFactor = DESIRED_WIDTH / Width;
    console.log(this.#scaleFactor);

    if (
      Width !== this.#canvas.current.width ||
      Height !== this.#canvas.current.height
    ) {
      this.#canvas.current.height = Height * this.#scaleFactor;
      this.#logSelection.baseImageRect.width = Width;
      this.#logSelection.baseImageRect.height = Height;
    }

    // Cleanup existing bitmap if it exist
    if (this.#imageBitmap != null) this.#imageBitmap.close();
    this.#imageBitmap = await createImageBitmap(imageData);
    const ctx: CanvasRenderingContext2D = this.#canvas.current.getContext('2d');
    ctx.clearRect(0, 0, Width, Height);
    this.DrawBitmapImage(ctx);
    if (
      this.#logSelection.selectionRect.width > 0 &&
      this.#logSelection.selectionRect.height > 0
    ) {
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
      this.#logSelection.selectionRect.left,
      this.#logSelection.selectionRect.top,
      this.#logSelection.selectionRect.width,
      this.#logSelection.selectionRect.height
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
    ctx.scale(-this.#scaleFactor, this.#scaleFactor);
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
    this.#logSelection.selectionRect.left = e.nativeEvent.offsetX;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.#logSelection.selectionRect.top = e.nativeEvent.offsetY;
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
    this.#logSelection.selectionRect.width =
      ev.offsetX - this.#logSelection.selectionRect.left;
    this.#logSelection.selectionRect.height =
      ev.offsetY - this.#logSelection.selectionRect.top;
    this.UpdateSelection();
  }

  SaveAreaPref(): void {
    // Set preferences on save
    this.#ipc.setPref(TRIBELOGGER_LOGSELECTION_KEY, this.#logSelection);
  }

  // async GetAreaPref(): Promise<void> {
  //   const area: WindowImagetter.Area = (await this.#ipc.getPref(
  //     TRIBELOGGER_AREA_KEY
  //   )) as WindowImagetter.Area;
  //   this.UpdateSelectionRect(area);
  // }

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
        <Typography>
          Adjust the green selection box where you see your ark window to cover
          the tribe log text only.
        </Typography>
        <canvas
          id="myCanvas"
          ref={this.#canvas}
          width={DESIRED_WIDTH}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onMouseDown={this.BindForCanvasSelection}
          onMouseUp={this.UnbindForCanvasSelection}
          onMouseLeave={this.UnbindForCanvasSelection}
        />
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
          Refresh Screenshot
        </Button>
        {/* <Button onClick={this.ClearPrefs} varient="contained" color="secondary">
          Clear
        </Button> */}
      </div>
    );
  }
}
