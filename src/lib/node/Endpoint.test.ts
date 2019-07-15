import { createEmptyMockDriver } from "../../../test/mocks";
import { assertZWaveError } from "../../../test/util";
import { BasicCCAPI } from "../commandclass/BasicCC";
import { CommandClasses } from "../commandclass/CommandClasses";
import { Driver } from "../driver/Driver";
import { ZWaveErrorCodes } from "../error/ZWaveError";
import { Endpoint } from "./Endpoint";

describe("lib/node/Endpoint", () => {
	describe("createAPI", () => {
		const fakeDriver = (createEmptyMockDriver() as unknown) as Driver;
		it("throws if a non-implemented API should be created", () => {
			const endpoint = new Endpoint(1, fakeDriver, 1);

			assertZWaveError(() => endpoint.createAPI(0xbada55), {
				errorCode: ZWaveErrorCodes.CC_NoAPI,
				messageMatches: "no associated API",
			});
		});

		it("the returned API throws when trying to access a non-supported CC", () => {
			const endpoint = new Endpoint(1, fakeDriver, 1);
			const api = endpoint.createAPI(CommandClasses.Basic) as BasicCCAPI;

			// this does not throw
			api.isSupported();
			// this does
			assertZWaveError(() => api.get(), {
				errorCode: ZWaveErrorCodes.CC_NotSupported,
				messageMatches: "Node 1 (endpoint 1) does not support",
			});

			// It only includes the endpoint number for non-root endpoints
			(endpoint as any).endpointIndex = 0;
			assertZWaveError(() => api.get(), {
				errorCode: ZWaveErrorCodes.CC_NotSupported,
				messageMatches: "Node 1 does not support",
			});
		});
	});

	describe("commandClasses dictionary", () => {
		const fakeDriver = (createEmptyMockDriver() as unknown) as Driver;
		it("throws when trying to access a non-implemented CC", () => {
			const endpoint = new Endpoint(1, fakeDriver, 1);
			assertZWaveError(() => endpoint.commandClasses["FOOBAR"], {
				errorCode: ZWaveErrorCodes.CC_NotImplemented,
				messageMatches: "FOOBAR is not implemented",
			});
		});
	});

	describe("createCCInstance()", () => {
		const fakeDriver = (createEmptyMockDriver() as unknown) as Driver;

		it("returns undefined if the node supports the CC but it is not yet implemented", () => {
			const endpoint = new Endpoint(1, fakeDriver, 1);
			const cc = 0xbada55;
			endpoint.addCC(cc, { isSupported: true });
			const instance = endpoint.createCCInstance(cc);
			expect(instance).toBeUndefined();
		});
	});
});
