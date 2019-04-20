'use strict';

//get libraries
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path')

//create express web-app
const app = express();
const router = express.Router();

//get the libraries to call
var network = require('./network/network.js');
var validate = require('./network/validate.js');
var analysis = require('./network/analysis.js');

//bootstrap application settings
app.use(express.static('./public'));
app.use('/scripts', express.static(path.join(__dirname, '/public/scripts')));
app.use(bodyParser.json());

//get home page
app.get('/home', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

//get member page
app.get('/member', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/member.html'));
});

//get member registration page
app.get('/registerMember', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/registerMember.html'));
});

//get partner page
app.get('/partner', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/partner.html'));
});

//get partner registration page
app.get('/registerPartner', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/registerPartner.html'));
});

//get about page
app.get('/about', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/about.html'));
});


//post call to register member on the network
app.post('/api/registerMember', function(req, res) {

  //declare variables to retrieve from request
  var accountNumber = req.body.accountnumber;
  var cardId = req.body.cardid;
  var firstName = req.body.firstname;
  var lastName = req.body.lastname;
  var email = req.body.email;
  var phoneNumber = req.body.phonenumber;

  //print variables
  console.log('Using param - firstname: ' + firstName + ' lastname: ' + lastName + ' email: ' + email + ' phonenumber: ' + phoneNumber + ' accountNumber: ' + accountNumber + ' cardId: ' + cardId );

  //validate member registration fields
  validate.validateMemberRegistration(cardId, accountNumber, firstName, lastName, email, phoneNumber)
    .then((response) => {
      //return error if error in response
      if (response.error != null) {
        res.json({
          error: response.error
        });
        return;
      } else {
        //else register member on the network
        network.registerMember(cardId, accountNumber, firstName, lastName, email, phoneNumber)
          .then((response) => {
            //return error if error in response
            if (response.error != null) {
              res.json({
                error: response.error
              });
            } else {
              //else return success
              res.json({
                success: response
              });
            }
          });
      }
    });


});

//post call to register partner on the network
app.post('/api/registerCompany', function(req, res) {

  //declare variables to retrieve from request
  var name = req.body.name;
  var CompanyId = req.body.partnerid;
  var cardId = req.body.cardid;

  //print variables
  console.log('Using param - name: ' + name + ' CompanyId: ' + CompanyId + ' cardId: ' + cardId);

  //validate partner registration fields
  validate.validatePartnerRegistration(cardId, CompanyId, name)
    .then((response) => {
      //return error if error in response
      if (response.error != null) {
        res.json({
          error: response.error
        });
        return;
      } else {
        //else register partner on the network
        network.registerCompany(cardId, CompanyId, name)
          .then((response) => {
            //return error if error in response
            if (response.error != null) {
              res.json({
                error: response.error
              });
            } else {
              //else return success
              res.json({
                success: response
              });
            }
          });
      }
    });

});



//post call to perform UsePoints transaction on the network
app.post('/api/userUsePoints', function(req, res) {

  //declare variables to retrieve from request
  var accountNumber = req.body.accountnumber;
  var cardId = req.body.cardid;
  var points = req.body.points;
  var CompanyId = req.body.partnerid;
  var credit = req.body.credit;

  //print variables
  console.log('Using param - points: ' + points + ' CompanyId: ' + CompanyId + ' accountNumber: ' + accountNumber + ' cardId: ' + cardId + ' credit: ' + credit);

  //validate points field
  validate.validatePoints(points)
    //return error if error in response
    .then((checkPoints) => {
      if (checkPoints.error != null) {
        res.json({
          error: checkPoints.error
        });
        return;
      } else {
        validate.validatePoints(credit)
        .then((checkCredit) => {
          //return error if error in response
          if (checkCredit.error != null) {
            res.json({
              error: checkCredit.error
            });
            return;
          }else{
        points = checkPoints;
        credit = checkCredit;
        //else perforn UsePoints transaction on the network
        network.userUsePointsTransaction(cardId, accountNumber, CompanyId, points,credit)
          .then((response) => {
            //return error if error in response
            if (response.error != null) {
              res.json({
                error: response.error
              });
            } else {
              //else return success
              res.json({
                success: response
            });
           }
        });
      }
    });
  }});
});


//post call to retrieve member data, transactions data and partners to perform transactions with from the network
app.post('/api/memberData', function(req, res) {

  //declare variables to retrieve from request
  var accountNumber = req.body.accountnumber;
  var cardId = req.body.cardid;

  //print variables
  console.log('memberData using param - ' + ' accountNumber: ' + accountNumber + ' cardId: ' + cardId);

  //declare return object
  var returnData = {};

  //get member data from network
  network.memberData(cardId, accountNumber)
    .then((member) => {
      //return error if error in response
      if (member.error != null) {
        res.json({
          error: member.error
        });
      } else {
        //else add member data to return object
        returnData.accountNumber = member.accountNumber;
        returnData.firstName = member.firstName;
        returnData.lastName = member.lastName;
        returnData.phoneNumber = member.phoneNumber;
        returnData.email = member.email;
        returnData.points = member.points;
        returnData.credit = member.credit;
      }

    })
    .then(() => {
      //get UsePoints transactions from the network
      network.usePointsTransactionsInfo(cardId)
        .then((userUsePointsResults) => {
          //return error if error in response
          if (userUsePointsResults.error != null) {
            res.json({
              error: userUsePointsResults.error
            });
          } else {
            //else add transaction data to return object
            returnData.usePointsResults = userUsePointsResults;
          }

        }).then(() => {
          //get EarnPoints transactions from the network
          network.earnPointsTransactionsInfo(cardId)
            .then((earnPointsResults) => {
              //return error if error in response
              if (earnPointsResults.error != null) {
                res.json({
                  error: earnPointsResults.error
                });
              } else {
                //else add transaction data to return object
                returnData.earnPointsResult = earnPointsResults;
              }

            })
            .then(() => {
              //get partners to transact with from the network
              network.allCompanysInfo(cardId)
              .then((CompanysInfo) => {
                //return error if error in response
                if (CompanysInfo.error != null) {
                  res.json({
                    error: CompanysInfo.error
                  });
                } else {
                  //else add partners data to return object
                  returnData.partnersData = CompanysInfo;
                }

                //return returnData
                res.json(returnData);

              });
            });
        });
    });

});

//post call to retrieve partner data and transactions data from the network
app.post('/api/partnerData', function(req, res) {

  //declare variables to retrieve from request
  var CompanyId = req.body.partnerid;
  var cardId = req.body.cardid;
  //print variables
  console.log('partnerData using param - ' + ' CompanyId: ' + CompanyId + ' cardId: ' + cardId);

  //declare return object
  var returnData = {};

  //get partner data from network
  network.CompanyData(cardId, CompanyId)
    .then((Company) => {
      //return error if error in response
      if (Company.error != null) {
        res.json({
          error: Company.error
        });
      } else {
        //else add partner data to return object
        returnData.id = Company.id;
        returnData.name = Company.name;
        returnData.points=Company.points;
        returnData.credit = Company.credit;
      }

    })
    .then(() => {
      //get UsePoints transactions from the network
      network.usePointsTransactionsInfo(cardId)
        .then((userUsePointsResults) => {
          //return error if error in response
          if (userUsePointsResults.error != null) {
            res.json({
              error: userUsePointsResults.error
            });
          } else {
            //else add transaction data to return object
            returnData.usePointsResults = userUsePointsResults;
            //add total points collected by partner to return object
            returnData.pointsCollected = analysis.totalPointsCollected(userUsePointsResults);
          }

        })
        .then(() => {
          //get EarnPoints transactions from the network
          network.earnPointsTransactionsInfo(cardId)
            .then((earnPointsResults) => {
              //return error if error in response
              if (earnPointsResults.error != null) {
                res.json({
                  error: earnPointsResults.error
                });
              } else {
                //else add transaction data to return object
                returnData.earnPointsResults = earnPointsResults;
                //add total points given by partner to return object
                returnData.pointsGiven = analysis.totalPointsGiven(earnPointsResults);
              }

              //return returnData
              res.json(returnData);

            });
        });
    });

});

//declare port
var port = process.env.PORT || 8000;
if (process.env.VCAP_APPLICATION) {
  port = process.env.PORT;
}

//run app on port
app.listen(port, function() {
  console.log('app running on port: %d', port);



});

//post call to perform userEarnPoints transaction on the network
app.post('/api/userEarnPoints', function(req, res) {

  //declare variables to retrieve from request
  var accountNumber = req.body.accountnumber;
  var cardId = req.body.cardid;
  var points = parseFloat(req.body.points);
  var CompanyId = req.body.partnerid;
  var credit = parseFloat(req.body.credit);

  //print variables
  console.log('Using param - points: ' + points + ' CompanyId: ' + CompanyId + ' accountNumber: ' + accountNumber + ' cardId: ' + cardId + ' credit: ' + credit);

  //validate points field
  validate.validatePoints(points)
    .then((checkPoints) => {
      //return error if error in response
      if (checkPoints.error != null) {
        res.json({
          error: checkPoints.error
        });
        return;
      } else {
        validate.validatePoints(credit)
        .then((checkCredit) => {
          //return error if error in response
          if (checkCredit.error != null) {
            res.json({
              error: checkCredit.error
            });
            return;
          }else{
        points = checkPoints;
        credit = checkCredit;
        //else perforn EarnPoints transaction on the network
        network.userEarnPointsTransaction(cardId, accountNumber, CompanyId, points,credit)
          .then((response) => {
            //return error if error in response
            if (response.error != null) {
              res.json({
                error: response.error
              });
            } else {
              //else return success
              res.json({
                success: response
              });
            }
          });
      }
    });

}});
});
