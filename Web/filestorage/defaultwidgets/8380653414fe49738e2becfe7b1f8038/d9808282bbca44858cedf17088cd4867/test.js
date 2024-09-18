/*

Tiny Test Framework
===================

 * Asynchronous
 * Configurable sequential or parallel execution mode
 * Configurable halting with "not run" counts
 * Configurable, colorized, logging
 * Self-summarizing, tabular, results
 * Stubs

Usage
-----

	test("X should Y", assert => {
		// ... perform test ...
		assert(someResult);
	});

Results of individual tests as well as a summary of all tests are written to the console.

Stub:

	test("Foo should Bar");


Async usage
-----------

Async tests run sequentially by default, queued to not continue the next queued `test()` until the previous has completed with an assertion

	test("A should B", assert => {
		setTimeout(() => assert(true), 100);
	});

	test("C should D", assert => {
		setTimeout(() => assert(false), 50);
	});

	test("E should F", assert => {
		setTimeout(() => assert(true), 150);
	});

Compatible with async/await

	test("G should I", async assert => {
		let result = await something();
		assert(result)
	});


Options
-------

// By default, async tests are run sequentially. They can also be run in parallel with `false`
test.sequential = true;

// By default, sequential tests that fail or error halt subsequent tests. This can be disabled with `false`
test.haltOnFail = true;

// By default, logging is written to the console. This can be configured
test.log = (message, status) => console.log(message);
test.summarize = results => console.table(results);

*/
const test = (() => {
	const results = [];
	let totalQueued = 0;
	let summaryTimeout;
	let running = false;
	let lastPromise = Promise.resolve();
	const PASS = 'PASS',
		FAIL = 'FAIL',
		ERROR = 'ERROR',
		STUB = 'NOT IMPLEMENTED',
		NOTRUN = 'NOT RUN',
		TOTAL = 'TOTAL';

	function enqueuePromise(fn) {
		lastPromise = lastPromise.then(
			res => (res === false ? false : new Promise(fn)),
			() => {
				test.log('HALTING TESTS');
				return false;
			}
		);
	}

	function summarize() {
		if (running) return;

		let successes = 0;
		let failures = 0;
		let stubs = 0;
		let errors = 0;

		for (let i = 0; i < results.length; i++) {
			switch(results[i].result) {
				case STUB:
					stubs++;
					break;
				case PASS:
					successes++;
					break;
				case FAIL:
					failures++;
					break;
				case ERROR:
					errors++;
					break;
			}
		}

		test.summarize({
			[TOTAL]: totalQueued,
			[PASS]: successes,
			[FAIL]: failures,
			[ERROR]: errors,
			[STUB]: stubs,
			[NOTRUN]: (totalQueued - results.length)
		});
	}

	function report(name, result) {
		clearTimeout(summaryTimeout);
		results.push({ name, result });
		test.log(`${result}: ${name}`, result);
		summaryTimeout = setTimeout(summarize, 25);
		running = false;
	}

	function test(name, impl) {
		totalQueued++;
		running = true;

		if (test.sequential) {
			enqueuePromise((resolve, reject) => {
				clearTimeout(summaryTimeout);
				if (!impl) {
					report(name, STUB);
					resolve();
				} else {
					try {
						impl(assertion => {
							report(name, (assertion ? PASS : FAIL));
							if (test.haltOnFail && !assertion) {
								reject();
							} else {
								resolve();
							}
						});
					} catch (e) {
						report(name, ERROR);
						if(test.haltOnFail) {
							reject();
						} else {
							resolve();
						}
					}
				}
			});
		} else {
			clearTimeout(summaryTimeout);
			if (!impl) {
				report(name, STUB);
			} else {
				try {
					impl(assertion => {
						report(name, (assertion ? PASS : FAIL));
					});
				} catch (e) {
					report(name, ERROR);
				}
			}
		}
	};

	test.sequential = true;
	test.haltOnFail = true;
	test.log = (msg, state) => {
		let color = 'black';
		switch (state) {
			case PASS:
				color = 'green';
				break;
			case FAIL:
			case ERROR:
				color = 'red';
				break;
			case STUB:
				color = 'gray';
		}
		console.log(`%c${msg}`, `color: ${color}`);
	};
	test.summarize = results => console.table(results);
	test.heading = heading => enqueuePromise((resolve, reject) => {
		test.log(heading);
		resolve();
	});

	return test;
})();
