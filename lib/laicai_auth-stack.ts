import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';
import { IdentityPool, IUserPoolAuthenticationProvider, UserPoolAuthenticationProvider } from 'aws-cdk-lib/aws-cognito-identitypool';

export class LaicaiAuthStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// Define the Lambda function resource
		const myFunction = new lambda.Function(this, "HelloWorldFunction", {
			runtime: lambda.Runtime.NODEJS_20_X, // Provide any supported Node.js runtime
			handler: "index.handler",
			code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          return {
            statusCode: 200,
            body: JSON.stringify('Hello World!'),
          };
        };
      `),
		});


		const userAuthCognito = new cognito.UserPool(this, 'LaicaiUserPool', {
			userPoolName: 'laicai-users',
			selfSignUpEnabled: true,
			userVerification: {
				emailSubject: 'Verify your email for our awesome app!',
				emailBody: 'Thanks for signing up to our awesome app! Your verification code is {####}',
				emailStyle: cognito.VerificationEmailStyle.CODE,
				smsMessage: 'Thanks for signing up to our awesome app! Your verification code is {####}',
			},
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

		new cdk.CfnOutput(this, "identity pool id", {
			value: userIdentityPool.identityPoolId,
		})

		const signUpFn = new lambda.Function(this, 'userSignupFn', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'index.handler',
			code: lambda.Code.fromAsset(path.join(__dirname, 'assets')),
		})

		const userClient = userAuthCognito.addClient('admin-client');
		new cdk.CfnOutput(this, "userClientId", {
			value: userClient.userPoolClientId,
		})
		// userAuthCognito.addTrigger(cognito.UserPoolOperation.PRE_SIGN_UP, signUpFn);

		// Define the Lambda function URL resource
		const myFunctionUrl = myFunction.addFunctionUrl({
			authType: lambda.FunctionUrlAuthType.NONE,
		});

		const signUpUrl = signUpFn.addFunctionUrl({
			authType: lambda.FunctionUrlAuthType.NONE,
		});

		// Define a CloudFormation output for your URL
		new cdk.CfnOutput(this, "signUpUrl", {
			value: signUpUrl.url,
		})
		// The code that defines your stack goes here

		// example resource
		// const queue = new sqs.Queue(this, 'LaicaiAuthQueue', {
		//   visibilityTimeout: cdk.Duration.seconds(300)
		// });
	}
}
