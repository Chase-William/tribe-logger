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

// const Settings = () => {
//   return (
//     <div>
//       <h1>Hello World!</h1>.
//       <button type="button" id="getBitmapBtn">
//         Test GetWindowBitmap()
//       </button>
//       <button type="button" id="getTribeLogBtn">
//         Test GetTribeLogText()
//       </button>
//       <button type="button" id="saveBtn">
//         Save
//       </button>
//       <button type="button" id="getPref">
//         Get
//       </button>
//       <button type="button" id="clearPrefs">
//         Clear Your Preferences
//       </button>
//       <p id="testPref">text</p>
//       <button type="button" id="settingsBtn">
//         Settings
//       </button>
//       <canvas id="myCanvas" width="640px" height="480px" />
//     </div>
//   );
// };

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.

/*
  Cannot import ipcTypes.d.ts for the interface IPCRenderer without a NULLRef exception during runtime due to exports..
  Cannot exclude the import from compliation either... welp
*/

// const ipc = window.ipcRenderer;
// // Tracks canvas event handler binding state
// let isBound = false;
// let selectionLeft = 0;
// let selectionTop = 0;
// let selectionWidth = 0;
// let selectionHeight = 0;
// let imageBitmap: ImageBitmap;
// const myCanvas: HTMLCanvasElement = document.querySelector('#myCanvas');
// const ctx: CanvasRenderingContext2D = myCanvas.getContext('2d'); // Changing param will change return data type
// ctx.fillStyle = '#22AA2266';

// /**
//  * Draws the selection rectangle to the canvas.
//  */
// function DrawSelection(): void {
//   ctx.fillRect(selectionLeft, selectionTop, selectionWidth, selectionHeight);
// }

// /**
//  * Draws the bitmapimage to the canvas properly.
//  */
// function DrawBitmapImage(): void {
//   ctx.save();
//   ctx.translate(myCanvas.width / 2, myCanvas.height / 2); // center img
//   ctx.rotate((180 * Math.PI) / 180); // rotate
//   ctx.scale(-1, 1);
//   ctx.drawImage(imageBitmap, -imageBitmap.width / 2, -imageBitmap.height / 2);
//   ctx.restore();
// }

// /**
//  * Updates the selection rectangle when it is invalidated
//  * while also making sure to re-draw other present visuals.
//  */
// function UpdateSelection(): void {
//   ctx.clearRect(0, 0, 640, 480);
//   if (imageBitmap != null) {
//     DrawBitmapImage();
//   }
//   DrawSelection();
// }

// /**
//  * Updates the image bitmap when it is invalidated
//  * while also making sure to re-draw other present visuals.
//  */
// function UpdateImageBitmap(): void {
//   ctx.clearRect(0, 0, 640, 480);
//   DrawBitmapImage();
//   if (selectionWidth > 0 && selectionHeight > 0) {
//     DrawSelection();
//   }
// }

// /**
//  *
//  * @param ev Mouse event info
//  */
// function OnMouseMove(ev: MouseEvent): void {
//   // console.log(ev.clientX + " | " + ev.clientY);
//   // Update width / height from move
//   selectionWidth = ev.offsetX - selectionLeft;
//   selectionHeight = ev.offsetY - selectionTop;
//   UpdateSelection();
// }

// /**
//  * If the user leaves the canvas while their mouse is down, unbind event handlers
//  * @param ev Mouse event info
//  */
// function OnMouseLeave(): void {
//   // eslint-disable-next-line @typescript-eslint/no-use-before-define
//   UnbindForCanvasSelection();
// }

// /**
//  * Binds event handlers to canvas events.
//  */
// function BindForCanvasSelection(): void {
//   isBound = true;
//   myCanvas.addEventListener('mousemove', OnMouseMove);
//   myCanvas.addEventListener('mouseleave', OnMouseLeave);
// }

// /**
//  * Unbinds event handlers from canvas events, checks to make sure they are not already unbound.
//  * After the unbinding, isBound is set to false.
//  */
// function UnbindForCanvasSelection(): void {
//   /**
//    * If a user leaves while mouse down and then returns and triggers a mouseup, the canvas this will be called.
//    * This is a problem because things are already unbind when they left the canvas with the mousedown, therefore
//    * use the boolean to ignore.
//    */
//   if (!isBound) return;
//   // eslint-disable-next-line no-console
//   console.log('Unbinding canvas selection event handlers.');
//   myCanvas.removeEventListener('mousemove', OnMouseMove);
//   myCanvas.addEventListener('mouseleave', OnMouseLeave);
//   isBound = false;
// }

// /**
//  * Sets the UI selection from the saved preferences.
//  */
// async function SetSelectionFromPref() {
//   const rect = await ipc.getPref('streaming.area');

//   selectionLeft = rect.left;
//   selectionTop = rect.top;
//   selectionWidth = rect.width;
//   selectionHeight = rect.height;
//   UpdateSelection();
// }

// // const getBitmapBtn: HTMLElement = document.querySelector('#getBitmapBtn');
// // getBitmapBtn.addEventListener('click', (): void => {
// //   ipc.getWindowBitmap('ARK: Survival Evolved');
// // });
// const getTribeLogBtn: HTMLElement = document.querySelector('#getTribeLogBtn');
// getTribeLogBtn.addEventListener('click', (): void => {
//   // ipc.makeIPCRequest('makeGetTribeLogTextRequest'); // Make request to (ipcMain) for a bitmap buffer ----------- TODO add tribe log call
// });
// const saveBtn: HTMLElement = document.querySelector('#saveBtn');
// saveBtn.addEventListener('click', (): void => {
//   // Set preferences on save
//   ipc.setPref({
//     streaming: {
//       // main container
//       area: {
//         // area to be used for ocr
//         left: selectionLeft,
//         top: selectionTop,
//         width: selectionWidth,
//         height: selectionHeight,
//       },
//     },
//   });
// });
// document.querySelector('#clearPrefs').addEventListener('click', () => {
//   // Clear all saved preferences
//   ipc.clearPrefs();
//   // Reset selection rectangle
//   selectionLeft = 0;
//   selectionTop = 0;
//   selectionWidth = 0;
//   selectionHeight = 0;
//   UpdateSelection();
// });
// // document.querySelector("#settingsBtn").addEventListener('click', () => {

// // });

// const getBtn: HTMLElement = document.querySelector('#getPref');

// // const testPref: HTMLElement = document.querySelector("#testPref");

// getBtn.addEventListener('click', SetSelectionFromPref);

// myCanvas.addEventListener('mousedown', (ev: MouseEvent): void => {
//   BindForCanvasSelection();
//   // eslint-disable-next-line no-console
//   console.log(ev.offsetX);
//   selectionLeft = ev.offsetX;
//   selectionTop = ev.offsetY;
// });
// myCanvas.addEventListener('mouseup', (): void => {
//   UnbindForCanvasSelection();
// });

// async function GetBitmapWindow() {
//   // let error: number;
//   // let buffer: ArrayBuffer;
//   const { ErrorCode, BitmapBuffer } = await ipc.getWindowBitmap(
//     'ARK: Survival Evolved'
//   );

//   if (ErrorCode !== 0) {
//     // throw error msg here
//     // eslint-disable-next-line no-console
//     console.log(`error getting bitmap: ${ErrorCode}`);
//     return;
//   }

//   // Create image data structure from buffer
//   const imageData = new ImageData(
//     new Uint8ClampedArray(BitmapBuffer),
//     640,
//     480
//   );

//   // Cleanup existing bitmap if it exist
//   if (imageBitmap != null) imageBitmap.close();

//   imageBitmap = await createImageBitmap(imageData);
//   UpdateImageBitmap();
// }

// GetBitmapWindow();
// SetSelectionFromPref(); // Set on startup
