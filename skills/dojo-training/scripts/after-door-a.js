#!/usr/bin/env node
/**
 * Door A Done hook. Setup files exist; now invite 101. Never writes.
 *
 *   node after-door-a.js
 */
'use strict';

const { invite } = require('./invite-training.js');

const report = invite('door_a');
process.stdout.write(`${JSON.stringify(report)}\n`);
process.exit(0);
