# SCANNING-POC

## Overview

SCANNING-POC is a proof-of-concept (POC) project designed to integrate and utilize the scanner library efficiently. This document provides step-by-step instructions on how to build, link, and use the library in any Angular project.


## Library Integration (if not already done)

Before using the `scanner` library, ensure that it is built and linked properly. Follow the steps below for a smooth integration.

1. Build the Library

To build the `scanner` library, execute the following steps:

1. Navigate to the library directory:
```bash
cd scanner-lib/
```

2. Build the `scanner` library using Angular CLI:
```bash
ng build scanner
```

3. Move to the distribution directory:
```bash
cd dist/scanner
```

4. Link the built library:
```bash
npm link
```
This process ensures that the library is built and can be used across multiple projects without needing to publish it to an npm registry.


## Using the Library in a Project

Once the library is built and linked, you can integrate it into any Angular project.

1. Link the Library to the Project
Open the terminal in the project where you want to use the `scanner` library and run:

```bash
npm link scanner
```
This command links the scanner library to your project, allowing it to be used as if it were installed via npm.


2. Import and Configure the Library

Modify your Angular module (app.module.ts or any feature module) to include the required module(s) from the library.

Example:

```js
import { ImageCropperModule } from 'image-cropper';

@NgModule({
  imports: [
    ImageCropperModule,
    // other imports
  ],
  // other configurations
})
export class AppModule { }
```