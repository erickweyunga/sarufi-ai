import type { Strategy } from "../types";
import { Sarufi } from "./sarufi";

/**
 * @class Builder
 * @description A builder class for constructing and configuring a conversation system.
 * It allows for the registration of custom strategies before building the conversation system.
 */
export class Builder {
    private system: Sarufi;
    private strategies: Strategy[] = [];

    /**
     * @constructor
     * @description Initializes a new instance of the Builder,
     * creating a new conversation system internally.
     */
    constructor() {
        this.system = new Sarufi();
    }

    /**
     * @method withStrategy
     * @param strategy - The custom strategy to be added to the conversation system.
     * @returns The current instance of Builder for method chaining.
     * @description Adds a custom strategy to be registered with the conversation system
     * when build() is called.
     */
    withStrategy(strategy: Strategy): Builder {
        this.strategies.push(strategy);
        return this;
    }

    /**
     * @method build
     * @returns The configured Sarufi instance.
     * @description Registers all added strategies with the internal conversation system
     * and then returns the conversation system.
     */
    build(): Sarufi {
        for (const strategy of this.strategies) {
            this.system.registerStrategy(strategy);
        }
        return this.system;
    }
}

/**
 * @function createBuilder
 * @returns A new instance of Builder.
 * @description A factory function to create a new builder for the conversation system.
 */
export function createBuilder(): Builder {
    return new Builder();
}

/**
 * @function createCustomSarufiSystem
 * @param strategy - The custom strategy to be used for the conversation system.
 * @returns A new Sarufi instance pre-configured with the given strategy.
 * @description A convenience function to quickly create a conversation system
 * with a single custom strategy.
 */
export function createCustomSarufiSystem(strategy: Strategy): Sarufi {
    return createBuilder()
        .withStrategy(strategy)
        .build();
}
