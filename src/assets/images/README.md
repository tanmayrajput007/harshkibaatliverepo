# Images Folder

Place your image files here (e.g., `.jpg`, `.png`, `.gif`, `.svg`, `.webp`).

## Usage in Components

You can reference images in your Angular components using:

```html
<!-- In component templates -->
<img src="assets/images/your-image.jpg" alt="Description">

<!-- Or using Angular binding -->
<img [src]="'assets/images/your-image.jpg'" [alt]="imageAlt">
```

```typescript
// In component TypeScript files
imagePath = 'assets/images/your-image.jpg';
```

## Note

The `assets` folder is configured in `angular.json` and will be copied to the build output during compilation.

