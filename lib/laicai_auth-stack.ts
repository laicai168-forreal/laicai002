import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { IdentityPool, UserPoolAuthenticationProvider } from 'aws-cdk-lib/aws-cognito-identitypool';

export class LaicaiAuthStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const userAuthCognito = new cognito.UserPool(this, 'LaicaiUserPool', {
			userPoolName: 'laicai-users',
			selfSignUpEnabled: true,
			userVerification: {
				emailSubject: 'Verify your email for our app!',
				emailBody: 'Thanks for signing up to our app! Your verification code is {####}',
				emailStyle: cognito.VerificationEmailStyle.CODE,
				smsMessage: 'Thanks for signing up to our app! Your verification code is {####}',
			},
			// currently only support email registration, will need to update it to phone and usernames
			// signInAliases: { username: true, email: true, phone: true },
			autoVerify: { email: true, phone: true },
		});

		const customAuthenticationProvider = new UserPoolAuthenticationProvider({ userPool: userAuthCognito });

		const userIdentityPool = new IdentityPool(this, 'LaicaiItentityBeta', {
			identityPoolName: 'LaicaiItentityBeta',
			authenticationProviders: {
				userPools: [customAuthenticationProvider],
			}
		});

		const userClient = userAuthCognito.addClient('admin-client');

		new cdk.CfnOutput(this, "userClientId", {
			value: userClient.userPoolClientId,
		});

				new cdk.CfnOutput(this, "identity pool id", {
			value: userIdentityPool.identityPoolId,
		})
	}
}
