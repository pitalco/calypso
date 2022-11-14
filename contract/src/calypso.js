import '@agoric/zoe/exported.js';
import { Far } from '@agoric/marshal';
import { defineKind, makeScalarBigMapStore } from '@agoric/vat-data';
import { agSwap } from './swap';
import { E } from '@endo/eventual-send';

const createAccountsStore = async (address, instanceIca, handler) => {

    const accountRegistry = makeScalarBigMapStore('caccounts');

    // Create the store behavior and stores for Calypso accounts
    const initAccounts = (address) => ({ account: address, "osmosis": null, "juno": null, "secret": null, "cosmos": null })
    const accountsBehavior = {
        /**
         * Open the Calypso account.
         * 
         * @param {MsgOpenAccount} msg
         * @returns {Promise<Object>}
         */
        open: async ({state}, msg) => {
            // if the account is not null, it is set
            if (state.account != msg.account) { throw Error(`Unauthorized access`) }
            // Create a connection object for osmosis
            state.osmosis = await E(instanceIca.publicFacet).createICAAccount(msg.port, handler, msg.osmosis.agoric, msg.osmosis.counterparty)
            // Create a connection object for juno
            state.juno = await E(instanceIca.publicFacet).createICAAccount(msg.port, handler, msg.juno.agoric, msg.juno.counterparty)
            // Create a connection object for secret
            state.secret = await E(instanceIca.publicFacet).createICAAccount(msg.port, handler, msg.secret.agoric, msg.secret.counterparty)
            // Create a connection object for cosmos
            state.cosmos = await E(instanceIca.publicFacet).createICAAccount(msg.port, handler, msg.cosmos.agoric, msg.cosmos.counterparty)
            // Set the new Calypso account with the connections
            state["address"] = msg.account
            return state
        },
        /**
         * Add a new chain connection to a Calypso account.
         * 
         * @param {MsgAddAccount} msg
         * @returns {Promise<String>}
         */
        add: async ({state}, msg) => {
            // check if this account is the instance account
            if (state.account != msg.account) { throw Error(`Unauthorized access`) }
            // Create a connection object for new chain
            state[msg.chainName] = await E(instanceIca.publicFacet).createICAAccount(msg.port, handler, msg.chain.agoric, msg.chain.counterparty)
            return state
        },
        // Get the Calypso account by looking up via Agoric address and getting the connections
        // associated with it.
        getAccount: ({state}, agoricAccount) => {
            // ensure accounts match this contracts account
            if (state.account != agoricAccount) { throw Error(`Unauthorized access`) }
            return state
        }
    }

    const finishAccount = ({ state, self }) => {
        accountRegistry.init(state.name, self);
    };

    // Create the virtual object store
    const makeAccountsStore = defineKind('accounts', initAccounts, accountsBehavior, { finish: finishAccount });

    // Initialize the virtual object store
    const accounts = makeAccountsStore(address);

    return accounts
}

/**
 * Initializes Calypso and then returns the Calypso object to interact with Calypso for the account.
 * 
 * @param {ZoeService} zoe
 * @param {NameAdmin} nameAdmin
 * @returns {Promise<CalypsoResponse>}
 */
export const startCalypso = async (zoe, nameAdmin) => {

    const nameHub = E(nameAdmin).readonly()

    // start the ica instance
    const interaccounts = await E(nameHub).lookup("interaccounts");
    const instanceIca = await E(zoe).startInstance(interaccounts);

    // setup the ica connection handler
    /** @type {ConnectionHandler} */
    const connectionHandlerICA = Far('handler', {
        onOpen: async (c) => { 
          //console.log("Connection opened: ", c) 
        },
        onReceive: async (c, p) => {
          console.log('Received packet: ', p);
          const ret = "packets are not handled on this port"
          return ret
        },
        onClose: async (c) => { 
          console.log(`Connection closed: `, c) 
        }
    });

    const accounts = await createAccountsStore(address, instanceIca, connectionHandlerICA);

    return Far('calypso', {
        /**
         * Get the Calypso account and the connection objects for the account using Agoric bech32 address.
         *
         * @param {String} agoricAccount
         * @returns {Promise<Object>}
         */
         async getCalypsoAccount (agoricAccount) {
            const ret = await accounts.getAccount(agoricAccount)
            return ret
        },
        /**
         * Open up a Calypso account and create channels/connections for each chain needed for each protocol.
         *
         * @param {MsgOpenAccount} msg
         * @returns {Promise<String>}
         */
         async openCalypsoAccount (msg) {
            const ret = await accounts.open(msg)
            return ret
        },
        /**
         * Add a new connection to the Calypso account for the Agoric account specified.
         *
         * @param {MsgAddAccount} msg
         * @returns {Promise<String>}
         */
         async addConnectionToCalypsoAccount (msg) {
            const ret = await accounts.add(msg)
            return ret
        },
        /**
         * Performs a Swap/trade on the protocol defined within the Msg.
         *
         * @param {MsgSwap} msg
         * @returns {Promise<String>}
         */
        async aggregatedSwap (msg) {
            const ret = await agSwap(accounts, msg)
            return ret
        },
        /**
         * Adds liquidity to an AMM for the protocol defined within the Msg.
         *
         * @param {MsgAddLP} msg
         * @returns {Promise<String>}
         */
         async aggregatedAddLP (msg) {
            const ret = await agAddLP(accounts, msg)
            return ret
        },
        /**
         * Removes liquidity to an AMM for the protocol defined within the Msg.
         *
         * @param {MsgRemoveLP} msg
         * @returns {Promise<String>}
         */
         async aggregatedRemoveLP (msg) {
            const ret = await agRemoveLP(accounts, msg)
            return ret
        },
        /**
         * Stakes assets for the protocol defined within the Msg.
         *
         * @param {MsgStake} msg
         * @returns {Promise<String>}
         */
         async aggregatedStake (msg) {
            const ret = await stake(accounts, msg)
            return ret
        },
        /**
         * Unstakes assets for the protocol defined within the Msg.
         *
         * @param {MsgUnstake} msg
         * @returns {Promise<String>}
         */
         async aggregatedUnstake (msg) {
            const ret = await unstake(accounts, msg)
            return ret
        },
        /**
         * Restakes assets for the protocol defined within the Msg.
         *
         * @param {MsgRestake} msg
         * @returns {Promise<String>}
         */
         async aggregatedRestake (msg) {
            const ret = await restake(accounts, msg)
            return ret
        },
    })
}