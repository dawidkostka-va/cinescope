declare module '@mui/utils/types' {
  interface DataAttributesOverrides {
    [k: `data-${string}`]: string | number | boolean | undefined;
  }
}
