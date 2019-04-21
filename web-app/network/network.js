const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');

//declate namespace
const namespace = 'org.pikachu2.biznet';

//in-memory card store for testing so cards are not persisted to the file system
const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );

//admin connection to the blockchain, used to deploy the business network
let adminConnection;

//this is the business network connection the tests will use.
let businessNetworkConnection;

let businessNetworkName = 'pika-network';
let factory;


/*
 * Import card for an identity
 * @param {String} cardName The card name to use for this identity
 * @param {Object} identity The identity details
 */
async function importCardForIdentity(cardName, identity) {

  //use admin connection
  adminConnection = new AdminConnection();
  businessNetworkName = 'pika-network';

  //declare metadata
  const metadata = {
      userName: identity.userID,
      version: 1,
      enrollmentSecret: identity.userSecret,
      businessNetwork: businessNetworkName
  };

  //get connectionProfile from json, create Idcard
  const connectionProfile = require('./local_connection.json');
  const card = new IdCard(metadata, connectionProfile);

  //import card
  await adminConnection.importCard(cardName, card);
}


/*
* Reconnect using a different identity
* @param {String} cardName The identity to use
*/
async function useIdentity(cardName) {

  //disconnect existing connection
  await businessNetworkConnection.disconnect();

  //connect to network using cardName
  businessNetworkConnection = new BusinessNetworkConnection();
  await businessNetworkConnection.connect(cardName);
}


//export module
module.exports = {

  /*
  * Create Member participant and import card for identity
  * @param {String} cardId Import card id for member
  * @param {String} accountNumber Member account number as identifier on network
  * @param {String} firstName Member first name
  * @param {String} lastName Member last name
  * @param {String} phoneNumber Member phone number
  * @param {String} email Member email
  */
 registerMember: async function (cardId, accountNumber,firstName, lastName, email, phoneNumber,a,b) {
    try {

      //connect as admin
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect('admin@pika-network');

      //get the factory for the business network
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //随机数
      var rand = (function(){
        var today = new Date();
        var seed = today.getTime();
        function rnd(){
          seed = ( seed * 9301 + 49297 ) % 233280;
          return seed / ( 233280.0 );
        };
        return function rand(number){
          return Math.ceil(rnd(seed) * number);
        };
      })();
      

      //create member participant
      const member = factory.newResource(namespace, 'Member', accountNumber);
      member.firstName = firstName;
      member.lastName = lastName;
      member.email = email;
      member.phoneNumber = phoneNumber;
      member.points = 100;
      member.credit = rand(100);

      //add member participant
      const participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.Member');
      await participantRegistry.add(member);

      //issue identity
      const identity = await businessNetworkConnection.issueIdentity(namespace + '.Member#' + accountNumber, cardId);

      //import card for identity
      await importCardForIdentity(cardId, identity);

      //disconnect
      await businessNetworkConnection.disconnect('admin@pika-network');

      return true;
    }
    catch(err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },

  /*
  * Create Company participant and import card for identity
  * @param {String} cardId Import card id for Company
  * @param {String} CompanyId Company Id as identifier on network
  * @param {String} name Company name
  */
  registerCompany: async function (cardId, CompanyId, name) {

    try {

      //connect as admin
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect('admin@pika-network');

      //get the factory for the business network.
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      var rand = (function(){
        var today = new Date();
        var seed = today.getTime();
        function rnd(){
          seed = ( seed * 9301 + 49297 ) % 233280;
          return seed / ( 233280.0 );
        };
        return function rand(number){
          return Math.ceil(rnd(seed) * number);
        };
      })();

      //create Company participant
      const Company = factory.newResource(namespace, 'Company', CompanyId);
      Company.name = name;
      Company.points = 10000;
      Company.credit = rand(100);

      //add Company participant
      const participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.Company');
      await participantRegistry.add(Company);

      //issue identity
      const identity = await businessNetworkConnection.issueIdentity(namespace + '.Company#' + CompanyId, cardId);

      //import card for identity
      await importCardForIdentity(cardId, identity);

      //disconnect
      await businessNetworkConnection.disconnect('admin@pika-network');

      return true;
    }
    catch(err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },

  /*
  * Perform EarnPoints transaction
  * @param {String} cardId Card id to connect to network
  * @param {String} accountNumber Account number of member
  * @param {String} CompanyId Company Id of Company
  * @param {Integer} points Points value
  */
  userEarnPointsTransaction: async function (cardId, accountNumber, CompanyId, points,credit) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //get the factory for the business network.
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //create transaction
      let userEarnPoints = factory.newTransaction(namespace, 'userEarnPoints');
      userEarnPoints.points = points;
      userEarnPoints.credit = credit;
      userEarnPoints.member = factory.newRelationship(namespace, 'Member', accountNumber);
      userEarnPoints.company = factory.newRelationship(namespace, 'Company', CompanyId);  //company一定要小写

      //submit transaction
      await businessNetworkConnection.submitTransaction(userEarnPoints);

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      return true;
    }
    catch(err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },

  /*
  * Perform userUsePoints transaction
  * @param {String} cardId Card id to connect to network
  * @param {String} accountNumber Account number of member
  * @param {String} CompanyId Company Id of Company
  * @param {Integer} points Points value
  */
  userUsePointsTransaction: async function (cardId, accountNumber, CompanyId, points,credit) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //get the factory for the business network.
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //create transaction
      const userUsePoints = factory.newTransaction(namespace, 'userUsePoints');
      userUsePoints.points = points;
      userUsePoints.credit = credit;
      userUsePoints.member = factory.newRelationship(namespace, 'Member', accountNumber);
      userUsePoints.company = factory.newRelationship(namespace, 'Company', CompanyId);

      //submit transaction
      await businessNetworkConnection.submitTransaction(userUsePoints);

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      return true;
    }
    catch(err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }

  },

  /*
  * Get Member data
  * @param {String} cardId Card id to connect to network
  * @param {String} accountNumber Account number of member
  */
  memberData: async function (cardId, accountNumber) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //get member from the network
      const memberRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.Member');
      const member = await memberRegistry.get(accountNumber);

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      //return member object
      return member;
    }
    catch(err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },

  /*
  * Get Company data
  * @param {String} cardId Card id to connect to network
  * @param {String} CompanyId Company Id of Company
  */
  CompanyData: async function (cardId, CompanyId) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //get member from the network
      const CompanyRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.Company');
      const Company = await CompanyRegistry.get(CompanyId);

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      //return Company object
      return Company;
    }
    catch(err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }

  },

  /*
  * Get all Companys data
  * @param {String} cardId Card id to connect to network
  */
  allCompanysInfo : async function (cardId) {

    try {
      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //query all Companys from the network
      const allCompanys = await businessNetworkConnection.query('selectCompanys');

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      //return allCompanys object
      return allCompanys;
    }
    catch(err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  },

  /*
  * Get all EarnPoints transactions data
  * @param {String} cardId Card id to connect to network
  */
  earnPointsTransactionsInfo: async function (cardId) {

    try {
      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //query EarnPoints transactions on the network
      const earnPointsResults = await businessNetworkConnection.query('selectUserEarnPoints');

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      //return earnPointsResults object
      return earnPointsResults;
    }
    catch(err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }

  },

  /*
  * Get all userUsePoints transactions data
  * @param {String} cardId Card id to connect to network
  */
  usePointsTransactionsInfo: async function (cardId) {

    try {
      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //query userUsePoints transactions on the network
      const userUsePointsResults = await businessNetworkConnection.query('selectUserUsePoints');

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      //return userUsePointsResults object
      return userUsePointsResults;
    }
    catch(err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }

  }

}
