import assert from "assert";
import { 
  TestHelpers,
  AppHub_AccountDeployed
} from "generated";
const { MockDb, AppHub } = TestHelpers;

describe("AppHub contract AccountDeployed event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for AppHub contract AccountDeployed event
  const event = AppHub.AccountDeployed.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("AppHub_AccountDeployed is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await AppHub.AccountDeployed.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualAppHubAccountDeployed = mockDbUpdated.entities.AppHub_AccountDeployed.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedAppHubAccountDeployed: AppHub_AccountDeployed = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      user: event.params.user,
      smartAccount: event.params.smartAccount,
      timestamp: event.params.timestamp,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualAppHubAccountDeployed, expectedAppHubAccountDeployed, "Actual AppHubAccountDeployed should be the same as the expectedAppHubAccountDeployed");
  });
});
