/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/* global getParticipantRegistry emit */

/**
 * userUsePoints transaction
 * @param {org.pikachu2.biznet.userUsePoints} userearnPoints
 * @transaction
 */
async function userUsePoints(userearnPoints) {

  //update member points
  userearnPoints.member.points = userearnPoints.member.points - userearnPoints.points;
  let credit=userearnPoints.credit;
  

  //对于最高信用等级用户，允许与所有商户交易
  if(credit>67){
    //update member
    const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
    await memberRegistry.update(userearnPoints.member);

    //update company
    // check if company exists on the network
    const companyRegistry = await getParticipantRegistry('org.pikachu2.biznet.Company');
    companyExists = await companyRegistry.exists(userearnPoints.company.id);
    if (companyExists == false) {
    throw new Error('请检查是否选择公司');
    }
    else{userearnPoints.company.points = userearnPoints.company.points + userearnPoints.points;
      await companyRegistry.update(userearnPoints.company);
    }
  }

  //对于中等信用等级用户，只允许与高、中等商户交易
  else if(credit>33&&credit<=67){
    //update member
    const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
    await memberRegistry.update(userearnPoints.member);


    //update company
    // check if company exists on the network
    const companyRegistry = await getParticipantRegistry('org.pikachu2.biznet.Company');
    companyExists = await companyRegistry.exists(userearnPoints.company.id);
    if (companyExists == false) {
    throw new Error('请检查是否选择公司');
    }
    let result=await query('selectCompanysMH');
    if (result.length==0){
      throw new Error('无高、中等商户')
      }
    else if(result.length != 0){
    for(let n=0;n<result.length;n++){
      if(userearnPoints.company.id==result[n].id){
        userearnPoints.company.points = userearnPoints.company.points + userearnPoints.points;
        await companyRegistry.update(userearnPoints.company);
      }
    }}
    else{throw new Error('对于中等信用等级用户，只允许与高、中等商户交易')}
  }
  //对于低等级用户，只能与高商户交易
  else if(credit<=33){
   //update member
   const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
   await memberRegistry.update(userearnPoints.member);
   //update company
    // check if company exists on the network
    const companyRegistry = await getParticipantRegistry('org.pikachu2.biznet.Company');
    companyExists = await companyRegistry.exists(userearnPoints.company.id);
    if (companyExists == false) {
    throw new Error('请检查是否选择公司');
    }
   let result=await query('selectCompanysH');
   if (result.length==0){
    throw new Error('无高等商户')
    }
    else if(result.length != 0){
      for(let n=0;n<result.length;n++){
        if(userearnPoints.company.id==result[n].id){
          userearnPoints.company.points = userearnPoints.company.points + userearnPoints.points;
          await companyRegistry.update(userearnPoints.company);
        }
      }}
      else{throw new Error('对于低信用等级用户，只允许与高等商户交易')}
    }
  else{
    throw new Error('想想你写了啥-----logic.js/use'+credit)
  }
}


/**
 * EarnPoints transaction
 * @param {org.pikachu2.biznet.userEarnPoints} userearnPoints
 * @transaction
 */
async function userEarnPoints(userearnPoints) {

  //update member points
  userearnPoints.member.points = userearnPoints.member.points + userearnPoints.points;
  let credit=userearnPoints.credit;
  

  //对于最高信用等级用户，允许与所有商户交易
  if(credit>67){
    //update member
    const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
    await memberRegistry.update(userearnPoints.member);

    //update company
    // check if company exists on the network
    const companyRegistry = await getParticipantRegistry('org.pikachu2.biznet.Company');
    companyExists = await companyRegistry.exists(userearnPoints.company.id);
    if (companyExists == false) {
    throw new Error('请检查是否选择公司');
    }
    else{userearnPoints.company.points = userearnPoints.company.points - userearnPoints.points;
      await companyRegistry.update(userearnPoints.company);
    }
  }

  //对于中等信用等级用户，只允许与高、中等商户交易
  else if(credit>33&&credit<=67){
    //update member
    const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
    await memberRegistry.update(userearnPoints.member);
    //update company
    // check if company exists on the network
    const companyRegistry = await getParticipantRegistry('org.pikachu2.biznet.Company');
    companyExists = await companyRegistry.exists(userearnPoints.company.id);
    if (companyExists == false) {
    throw new Error('请检查是否选择公司');
    }
    let result=await query('selectCompanysMH');
    if (result.length==0){
      throw new Error('无高、中等商户')
      }
    else if(result.length != 0){
        for(let n=0;n<result.length;n++){
          if(userearnPoints.company.id==result[n].id){
            userearnPoints.company.points = userearnPoints.company.points - userearnPoints.points;
            await companyRegistry.update(userearnPoints.company);
          }
        }}
    else{throw new Error('对于中等信用等级用户，只允许与高、中等商户交易')}
      }
  //对于低等级用户，只能与高商户交易
  else if(credit<=33){
   //update member
   const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
   await memberRegistry.update(userearnPoints.member);
  //update company
    // check if company exists on the network
    const companyRegistry = await getParticipantRegistry('org.pikachu2.biznet.Company');
    companyExists = await companyRegistry.exists(userearnPoints.company.id);
    if (companyExists == false) {
    throw new Error('请检查是否选择公司');
    }
   let result=await query('selectCompanysH');
   if (result.length==0){
    throw new Error('无高等商户')
    }
  else if(result.length != 0){
      for(let n=0;n<result.length;n++){
        if(userearnPoints.company.id==result[n].id){
          userearnPoints.company.points = userearnPoints.company.points - userearnPoints.points;
          await companyRegistry.update(userearnPoints.company);
        }
      }}
  else{throw new Error('对于低信用等级用户，只允许与高等商户交易')}
    }
  else{
    throw new Error('想想你写了啥-----logic.js/use'+credit)
  }
}




/**
 * userEarnCredit transaction
 * @param {org.pikachu2.biznet.userEarnCredit} userearncredit
 * @transaction
 */
async function userEarnCredit(userearncredit) {
  //update member nowcredit
  userearncredit.member.credit = userearncredit.member.credit + userearncredit.credit;
  //update member
  const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
  await memberRegistry.update(userearncredit.member);
}
 /**
 * userloseCredit transaction
 * @param {org.pikachu2.biznet.userLoseCredit} userloseCredit
 * @transaction
 */
async function userLoseCredit(userloseCredit) {
    //update memberID nowCredit
    userloseCredit.member.credit = userloseCredit.member.credit - userloseCredit.credit;
  
    //update memberID
    const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
    await memberRegistry.update(userloseCredit.member);
   
  }
  
  /**
 * companyEarnCredit transaction
 * @param {org.pikachu2.biznet.companyEarnCredit} companyearncredit
 * @transaction
 */
async function companyEarnCredit(companyearncredit) {

  //update company nowcredit
  companyearncredit.company.credit = companyearncredit.company.credit + companyearncredit.credit;

  //update company
  const companyRegistry = await getParticipantRegistry('org.pikachu2.biznet.Company');
  await companyRegistry.update(companyearncredit.company);
}

 /**
 * companyloseCredit transaction
 * @param {org.pikachu2.biznet.companyLoseCredit} companyloseCredit
 * @transaction
 */
async function companyLoseCredit(companyloseCredit) {
    //update company Credit
    companyloseCredit.company.credit = companyloseCredit.company.credit - companyloseCredit.credit;
  
    //update company
    const companyRegistry = await getParticipantRegistry('org.pikachu2.biznet.Company');
    await companyRegistry.update(companyloseCredit.company);
   
  }

/**
 * EarnPoints transaction
 * @param {org.pikachu2.biznet.userEarnPointsFromUser} userearnPointsFromUser
 * @transaction
 */
async function userEarnPointsFromUser(userearnPointsFromUser) {

  //check if member2 has sufficient points
  if (userearnPointsFromUser.othermember.points < userearnPointsFromUser.points) {
    throw new Error('Insufficient points');
  }
  //update member points
  userearnPointsFromUser.member.points = userearnPointsFromUser.member.points + userearnPointsFromUser.points;

  //update member
  const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
  await memberRegistry.update(userearnPointsFromUser.member);

  // check if member2 exists on the network
  const member2Registry = await getParticipantRegistry('org.pikachu2.biznet.Member');
  member2Exists = await member2Registry.exists(userearnPointsFromUser.othermember.accountNumber);
  if (member2Exists == false) {
    throw new Error('member does not exist - check member2 id');
  }
}

/**
 * userUsePoints transaction
 * @param {org.pikachu2.biznet.userUsePointsToUser} userusePointsToUser
 * @transaction
 */
async function userUsePointsToUser(userusePointsToUser) {

  //check if member has sufficient points
  if (userusePointsToUser.member.points < userusePointsToUser.points) {
    throw new Error('Insufficient points');
  }

  //update member points
  userusePointsToUser.member.points = userusePointsToUser.member.points - userusePointsToUser.points;

  //update member
  const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
  await memberRegistry.update(userusePointsToUser.member);

  // check if member exists on the network
  const member2Registry = await getParticipantRegistry('org.pikachu2.biznet.Member');
  member2Exists = await member2Registry.exists(userusePointsToUser.othermember.accountNumber);
  if (member2Exists == false) {
    throw new Error('member does not exist - check member2 id');
  }
}

/**
 * EarnPoints transaction
 * @param {org.pikachu2.biznet.companyEarnPoints} companyearnPoints
 * @transaction
 */
async function companyEarnPoints(companyearnPoints) {

  //update company points
  companyearnPoints.company.points = companyearnPoints.company.points + companyearnPoints.points;

  //update company
  const companyRegistry = await getParticipantRegistry('org.pikachu2.biznet.Company');
  await companyRegistry.update(companyearnPoints.company);
  // check if member exists on the network
  const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
  memberExists = await memberRegistry.exists(companyearnPoints.member.accountNumber);
  if (memberExists == false) {
    throw new Error('member does not exist - check member id');
  }
}

/**
 * companyUsePoints transaction
 * @param {org.pikachu2.biznet.companyUsePoints} companyusePoints
 * @transaction
 */
async function companyUsePoints(companyusePoints) {

  //check if company has sufficient points
  if (companyusePoints.company.points < companyusePoints.points) {
   throw new Error('Insufficient points');
  }

  //update company points
  companyusePoints.company.points = companyusePoints.company.points - companyusePoints.points;

  //update company
  const companyRegistry = await getParticipantRegistry('org.pikachu2.biznet.Company');
  await companyRegistry.update(companyusePoints.company);
  
  // check if member exists on the network
  const memberRegistry = await getParticipantRegistry('org.pikachu2.biznet.Member');
  memberExists = await memberRegistry.exists(companyusePoints.member.accountNumber);
  if (memberExists == false) {
    throw new Error('company does not exist - check company id');
  }
}
