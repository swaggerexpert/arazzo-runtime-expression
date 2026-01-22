import { setSnapshotStateOptions } from 'mocha-expect-snapshot';

setSnapshotStateOptions({
  get snapshotFormat() {
    return {
      compareKeys: null,
      escapeString: false,
      printBasicPrototype: false,
    };
  },
});
