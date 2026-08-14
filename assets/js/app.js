import { boot, loadModules } from './core/motion.js';

loadModules();

/* Le lettrage du loader se compose en ~1200 ms — la cascade attend la fin. */
boot({ base: 350, step: 320, minTime: 1250 });
