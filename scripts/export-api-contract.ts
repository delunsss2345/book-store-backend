// import { execSync } from 'node:child_process';
// import fs from 'node:fs';
// import path from 'node:path';
// import * as ts from 'typescript';

// type PrimitiveWireType = 'string' | 'number' | 'boolean' | 'object' | 'unknown' | 'null';
// type AccessMode = 'public' | 'auth' | 'refresh' | 'shopper_session';
// type DataSource = 'ApiOkResponse' | 'TypeInference';
// type Confidence = 'high' | 'medium' | 'low';

// type ValidatorRule = {
//   name: string;
//   args: string[];
// };

// type ContractField = {
//   name: string;
//   in: 'path' | 'query' | 'header' | 'cookie' | 'body';
//   required: boolean;
//   wireType: PrimitiveWireType | 'array';
//   sourceType: string;
//   schemaRef: string | null;
//   validators: ValidatorRule[];
//   example?: unknown;
//   enumValues?: Array<string | number>;
//   default?: unknown;
//   nullable?: boolean;
//   optional?: boolean;
//   array?: boolean;
//   format?: string;
//   zodHint?: string;
// };

// type RequestContract = {
//   pathParams: ContractField[];
//   query: {
//     schemaRef: string | null;
//     fields: ContractField[];
//   };
//   headers: ContractField[];
//   cookies: ContractField[];
//   body: {
//     required: boolean;
//     sourceType: string | null;
//     wireType: PrimitiveWireType | 'array' | null;
//     schemaRef: string | null;
//     fields: ContractField[];
//     implicit: boolean;
//   } | null;
// };

// type RouteError = {
//   ref: string;
//   statusCodes: number[];
//   description: string;
// };

// type SuccessResponse = {
//   statusCode: number;
//   envelope: {
//     wrapper: 'ResponseDto';
//     fields: {
//       success: 'true';
//       statusCode: 'number';
//       message: 'string';
//       data: 'unknown';
//     };
//   };
//   dataSchemaRef: string | null;
//   dataSource: DataSource;
//   confidence: Confidence;
//   dataIsArray: boolean;
//   setCookies: Array<{
//     name: string;
//     requiredForClient?: boolean;
//     when: string;
//     options: Record<string, unknown>;
//   }>;
// };

// type ResponseContract = {
//   success: SuccessResponse[];
//   errors: RouteError[];
// };

// type SecurityContract = {
//   accessMode: AccessMode;
//   bearerRequired: boolean;
//   permissions: string[];
//   guards: string[];
//   customDecorators: string[];
// };

// type RouteContract = {
//   id: string;
//   controller: string;
//   methodName: string;
//   httpMethod: string;
//   fullPath: string;
//   sourceFile: string;
//   security: SecurityContract;
//   request: RequestContract;
//   response: ResponseContract;
//   notes: string[];
// };

// type SchemaProperty = {
//   sourceType: string;
//   wireType: PrimitiveWireType | 'array';
//   schemaRef: string | null;
//   required: boolean;
//   optional: boolean;
//   nullable: boolean;
//   array: boolean;
//   format?: string;
//   enumValues?: Array<string | number>;
//   validators: ValidatorRule[];
//   example?: unknown;
//   default?: unknown;
//   zodHint: string;
// };

// type SchemaEntry = {
//   kind: 'class' | 'typeAlias' | 'interface' | 'enum' | 'inline' | 'inferred';
//   sourceFile: string | null;
//   sourceType: string;
//   wireType: PrimitiveWireType | 'array' | 'enum';
//   properties: Record<string, SchemaProperty>;
//   required: string[];
//   additionalProperties: boolean;
//   enumValues?: Array<string | number>;
//   zodHint: string;
// };

// type ApiPropertyMeta = {
//   required?: boolean;
//   nullable?: boolean;
//   example?: unknown;
//   enumValues?: Array<string | number>;
//   default?: unknown;
//   isArray?: boolean;
// };

// type TypeAnalysis = {
//   sourceType: string;
//   wireType: PrimitiveWireType | 'array';
//   schemaTypeName: string | null;
//   nullable: boolean;
//   optional: boolean;
//   array: boolean;
//   enumValues: Array<string | number>;
//   format?: string;
// };

// type DeclarationEntry = {
//   name: string;
//   kind: 'class' | 'interface' | 'typeAlias' | 'enum';
//   sourceFile: ts.SourceFile;
//   node: ts.ClassDeclaration | ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration;
// };

// const HTTP_DECORATOR_MAP: Record<string, string> = {
//   Get: 'GET',
//   Post: 'POST',
//   Put: 'PUT',
//   Patch: 'PATCH',
//   Delete: 'DELETE',
//   Options: 'OPTIONS',
//   Head: 'HEAD',
//   All: 'ALL',
// };

// const HTTP_STATUS_NAME_TO_CODE: Record<string, number> = {
//   CONTINUE: 100,
//   SWITCHING_PROTOCOLS: 101,
//   PROCESSING: 102,
//   EARLY_HINTS: 103,
//   OK: 200,
//   CREATED: 201,
//   ACCEPTED: 202,
//   NON_AUTHORITATIVE_INFORMATION: 203,
//   NO_CONTENT: 204,
//   RESET_CONTENT: 205,
//   PARTIAL_CONTENT: 206,
//   AMBIGUOUS: 300,
//   MOVED_PERMANENTLY: 301,
//   FOUND: 302,
//   SEE_OTHER: 303,
//   NOT_MODIFIED: 304,
//   TEMPORARY_REDIRECT: 307,
//   PERMANENT_REDIRECT: 308,
//   BAD_REQUEST: 400,
//   UNAUTHORIZED: 401,
//   FORBIDDEN: 403,
//   NOT_FOUND: 404,
//   CONFLICT: 409,
//   UNPROCESSABLE_ENTITY: 422,
//   TOO_MANY_REQUESTS: 429,
//   INTERNAL_SERVER_ERROR: 500,
//   NOT_IMPLEMENTED: 501,
//   BAD_GATEWAY: 502,
//   SERVICE_UNAVAILABLE: 503,
//   GATEWAY_TIMEOUT: 504,
// };

// const WRAPPER_TYPE_NAMES = new Set([
//   'Promise',
//   'PrismaPromise',
// ]);

// const CLASS_VALIDATOR_DECORATORS = new Set([
//   'IsString',
//   'IsNumber',
//   'IsInt',
//   'IsBoolean',
//   'IsEmail',
//   'IsNotEmpty',
//   'IsOptional',
//   'IsEnum',
//   'IsIn',
//   'Min',
//   'Max',
//   'MinLength',
//   'MaxLength',
//   'Length',
//   'Matches',
//   'IsUUID',
//   'IsDate',
//   'IsDateString',
//   'ArrayMinSize',
//   'ArrayMaxSize',
//   'IsArray',
//   'ValidateNested',
//   'Transform',
//   'Type',
// ]);

// const CUSTOM_PARAMETER_DECORATORS = new Set([
//   'GetUser',
//   'GetAccessToken',
//   'UserAgent',
//   'GetOriginUrl',
//   'RefreshSession',
// ]);

// const EXTERNAL_ENUM_FALLBACK = new Set([
//   'UserStatus',
//   'Badge',
//   'EmailStatus',
//   'HTTPMethod',
//   'RoleCode',
//   'SessionStatus',
//   'VerificationType',
//   'DevicePlatform',
//   'BookFormat',
//   'OtpTypeFilter',
//   'EmailOutboxStatusFilter',
// ]);

// function main() {
//   const rootDir = process.cwd();
//   const packageJson = readJson(path.join(rootDir, 'package.json')) as { name?: string; version?: string };
//   const tsConfigPath = path.join(rootDir, 'tsconfig.json');
//   const parsedConfig = readTsConfig(rootDir, tsConfigPath);
//   const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
//   const checker = program.getTypeChecker();

//   const warnings: string[] = [];
//   const declarationIndex = buildDeclarationIndex(program);
//   const permissionMap = readPermissionCodeMap(program);
//   const schemaRegistry = new SchemaRegistry({
//     rootDir,
//     checker,
//     declarationIndex,
//     warnings,
//   });

//   const globalPrefix = resolveGlobalPrefix(rootDir);
//   const controllerFiles = findControllerFiles(path.join(rootDir, 'src', 'modules'));
//   const routes: RouteContract[] = [];
//   const controllerNameSet = new Set<string>();

//   for (const controllerFile of controllerFiles) {
//     const sourceFile = program.getSourceFile(controllerFile);
//     if (!sourceFile) {
//       warnings.push(`Cannot load source file: ${toPosix(path.relative(rootDir, controllerFile))}`);
//       continue;
//     }

//     const classes = sourceFile.statements.filter(ts.isClassDeclaration);
//     for (const classDecl of classes) {
//       if (!classDecl.name) {
//         continue;
//       }

//       const classDecorators = getDecorators(classDecl);
//       const controllerDecorator = findDecorator(classDecorators, 'Controller');
//       if (!controllerDecorator) {
//         continue;
//       }

//       const controllerPath = getFirstArgumentText(controllerDecorator, sourceFile) ?? '';
//       const normalizedControllerPath = stripQuotes(controllerPath).trim();
//       const controllerName = classDecl.name.text;
//       controllerNameSet.add(controllerName);
//       const classContext = createDecoratorContext(classDecorators, sourceFile, permissionMap);

//       for (const member of classDecl.members) {
//         if (!ts.isMethodDeclaration(member) || !member.name || !ts.isIdentifier(member.name)) {
//           continue;
//         }

//         const methodDecorators = getDecorators(member);
//         const httpDecorator = methodDecorators.find((decorator) => HTTP_DECORATOR_MAP[getDecoratorName(decorator)] !== undefined);
//         if (!httpDecorator) {
//           continue;
//         }

//         const httpDecoratorName = getDecoratorName(httpDecorator);
//         const httpMethod = HTTP_DECORATOR_MAP[httpDecoratorName];
//         const methodPathRaw = getFirstArgumentText(httpDecorator, sourceFile) ?? '';
//         const methodPath = stripQuotes(methodPathRaw).trim();
//         const fullPath = normalizePath(`/${globalPrefix}/${normalizedControllerPath}/${methodPath}`);
//         const methodName = member.name.text;
//         const sourcePath = toPosix(path.relative(rootDir, sourceFile.fileName));

//         const methodContext = createDecoratorContext(methodDecorators, sourceFile, permissionMap);
//         const security = buildSecurityContract(classContext, methodContext, member, sourceFile);
//         const parseBigIntTargets = extractParseBigIntTargets(member);
//         const request = buildRequestContract({
//           member,
//           sourceFile,
//           checker,
//           schemaRegistry,
//           parseBigIntTargets,
//           fullPath,
//           security,
//           warnings,
//         });

//         const response = buildResponseContract({
//           member,
//           sourceFile,
//           checker,
//           schemaRegistry,
//           methodDecorators,
//           httpMethod,
//           fullPath,
//           security,
//           parseBigIntTargets,
//           warnings,
//         });

//         const notes: string[] = [];
//         if (response.success[0] && response.success[0].dataSource === 'TypeInference') {
//           notes.push('Response schema inferred from type checker because ApiResponse type is missing.');
//         }
//         if (fullPath === '/api/v1/auth/refresh-token' && request.body?.implicit) {
//           notes.push('Injected implicit body.refreshToken based on RefreshGuard logic.');
//         }
//         if (security.accessMode === 'shopper_session') {
//           notes.push('Shopper session route can set or rotate guestSessionId cookie.');
//         }
//         if (fullPath === '/api/v1/auth/login' && httpMethod === 'POST') {
//           notes.push('Route sets device_fingerprint cookie when cookie is missing.');
//         }
//         if (parseBigIntTargets.size > 0) {
//           notes.push('Route validates selected params as bigint-like string via parseBigInt().');
//         }

//         routes.push({
//           id: `${httpMethod} ${fullPath}`,
//           controller: controllerName,
//           methodName,
//           httpMethod,
//           fullPath,
//           sourceFile: sourcePath,
//           security,
//           request,
//           response,
//           notes,
//         });
//       }
//     }
//   }

//   routes.sort((a, b) => {
//     if (a.fullPath === b.fullPath) {
//       if (a.httpMethod === b.httpMethod) {
//         return a.methodName.localeCompare(b.methodName);
//       }
//       return a.httpMethod.localeCompare(b.httpMethod);
//     }
//     return a.fullPath.localeCompare(b.fullPath);
//   });

//   const schemas = schemaRegistry.getSortedSchemas();
//   const sourceCommit = readGitCommit(rootDir);
//   const generatedAt = resolveGeneratedAt(rootDir, sourceCommit);
//   const contract = {
//     meta: {
//       generatedAt,
//       project: packageJson.name ?? 'unknown',
//       version: packageJson.version ?? '0.0.0',
//       globalPrefix,
//       sourceCommit,
//       routeCount: routes.length,
//       controllerCount: controllerNameSet.size,
//       schemaCount: Object.keys(schemas).length,
//     },
//     stats: {
//       controllers: controllerNameSet.size,
//       routes: routes.length,
//       schemas: Object.keys(schemas).length,
//       inferredResponseRoutes: routes.filter((route) => route.response.success[0]?.dataSource === 'TypeInference').length,
//       warnings: warnings.length,
//       checks: {
//         controllerCoverage: {
//           expected: 18,
//           actual: controllerNameSet.size,
//           pass: controllerNameSet.size === 18,
//         },
//         routeCoverage: {
//           expected: 57,
//           actual: routes.length,
//           pass: routes.length === 57,
//         },
//         prefixCoverage: {
//           expectedPrefix: '/api/v1/',
//           pass: routes.every((route) => route.fullPath.startsWith('/api/v1/')),
//         },
//       },
//     },
//     routes,
//     schemas,
//     errors: buildGlobalErrors(),
//     warnings,
//   };

//   const outputPath = path.join(rootDir, 'docs', 'api-contract.v1.json');
//   ensureDir(path.dirname(outputPath));
//   fs.writeFileSync(outputPath, stableStringify(contract), 'utf8');
//   console.log(`Exported API contract: ${toPosix(path.relative(rootDir, outputPath))}`);
//   console.log(`Controllers: ${controllerNameSet.size}, routes: ${routes.length}, schemas: ${Object.keys(schemas).length}`);
//   if (warnings.length > 0) {
//     console.log(`Warnings: ${warnings.length}`);
//   }
// }

// function readTsConfig(rootDir: string, tsConfigPath: string): ts.ParsedCommandLine {
//   const readResult = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
//   if (readResult.error) {
//     const message = ts.flattenDiagnosticMessageText(readResult.error.messageText, '\n');
//     throw new Error(`Cannot read tsconfig: ${message}`);
//   }
//   const parsed = ts.parseJsonConfigFileContent(readResult.config, ts.sys, rootDir);
//   if (parsed.errors.length > 0) {
//     const message = parsed.errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n');
//     throw new Error(`Invalid tsconfig:\n${message}`);
//   }
//   return parsed;
// }

// function readPermissionCodeMap(program: ts.Program): Map<string, string> {
//   const permissionMap = new Map<string, string>();
//   const permissionFile = program
//     .getSourceFiles()
//     .find((sourceFile) => toPosix(sourceFile.fileName).endsWith('src/common/constants/permission-pattern.constant.ts'));

//   if (!permissionFile) {
//     return permissionMap;
//   }

//   for (const statement of permissionFile.statements) {
//     if (!ts.isEnumDeclaration(statement) || statement.name.text !== 'PermissionCode') {
//       continue;
//     }

//     for (const member of statement.members) {
//       if (!member.name || !member.initializer) {
//         continue;
//       }
//       const memberName = member.name.getText(permissionFile);
//       const rawValue = literalExpressionToValue(member.initializer);
//       if (typeof rawValue === 'string') {
//         permissionMap.set(memberName, rawValue);
//       }
//     }
//   }

//   return permissionMap;
// }

// function buildDeclarationIndex(program: ts.Program): Map<string, DeclarationEntry[]> {
//   const index = new Map<string, DeclarationEntry[]>();

//   for (const sourceFile of program.getSourceFiles()) {
//     if (!isSourceFileFromProject(sourceFile.fileName)) {
//       continue;
//     }

//     for (const statement of sourceFile.statements) {
//       if (ts.isClassDeclaration(statement) && statement.name) {
//         addDeclaration(index, statement.name.text, {
//           name: statement.name.text,
//           kind: 'class',
//           sourceFile,
//           node: statement,
//         });
//         continue;
//       }
//       if (ts.isInterfaceDeclaration(statement) && statement.name) {
//         addDeclaration(index, statement.name.text, {
//           name: statement.name.text,
//           kind: 'interface',
//           sourceFile,
//           node: statement,
//         });
//         continue;
//       }
//       if (ts.isTypeAliasDeclaration(statement) && statement.name) {
//         addDeclaration(index, statement.name.text, {
//           name: statement.name.text,
//           kind: 'typeAlias',
//           sourceFile,
//           node: statement,
//         });
//         continue;
//       }
//       if (ts.isEnumDeclaration(statement) && statement.name) {
//         addDeclaration(index, statement.name.text, {
//           name: statement.name.text,
//           kind: 'enum',
//           sourceFile,
//           node: statement,
//         });
//       }
//     }
//   }

//   return index;
// }

// function addDeclaration(index: Map<string, DeclarationEntry[]>, name: string, entry: DeclarationEntry) {
//   const current = index.get(name);
//   if (current) {
//     current.push(entry);
//     return;
//   }
//   index.set(name, [entry]);
// }

// function isSourceFileFromProject(fileName: string): boolean {
//   if (fileName.endsWith('.d.ts')) {
//     return false;
//   }
//   return /[\\/]src[\\/]/.test(fileName);
// }

// function findControllerFiles(modulesRoot: string): string[] {
//   const result: string[] = [];
//   const queue: string[] = [modulesRoot];
//   while (queue.length > 0) {
//     const current = queue.shift() as string;
//     const entries = fs.readdirSync(current, { withFileTypes: true });
//     for (const entry of entries) {
//       const absolute = path.join(current, entry.name);
//       if (entry.isDirectory()) {
//         queue.push(absolute);
//         continue;
//       }
//       if (entry.isFile() && entry.name.endsWith('.controller.ts')) {
//         result.push(absolute);
//       }
//     }
//   }
//   result.sort((a, b) => toPosix(a).localeCompare(toPosix(b)));
//   return result;
// }

// function getDecorators(node: ts.Node): ts.Decorator[] {
//   if (!ts.canHaveDecorators(node)) {
//     return [];
//   }
//   return ts.getDecorators(node) ?? [];
// }

// function getDecoratorName(decorator: ts.Decorator): string {
//   const expression = decorator.expression;
//   if (ts.isCallExpression(expression)) {
//     return getExpressionName(expression.expression);
//   }
//   return getExpressionName(expression);
// }

// function getExpressionName(expression: ts.Expression): string {
//   if (ts.isIdentifier(expression)) {
//     return expression.text;
//   }
//   if (ts.isPropertyAccessExpression(expression)) {
//     return expression.name.text;
//   }
//   return expression.getText();
// }

// function findDecorator(decorators: ts.Decorator[], name: string): ts.Decorator | undefined {
//   return decorators.find((decorator) => getDecoratorName(decorator) === name);
// }

// function getDecoratorArguments(decorator: ts.Decorator): ts.NodeArray<ts.Expression> {
//   if (!ts.isCallExpression(decorator.expression)) {
//     return ts.factory.createNodeArray();
//   }
//   return decorator.expression.arguments;
// }

// function getFirstArgumentText(decorator: ts.Decorator, sourceFile: ts.SourceFile): string | null {
//   const args = getDecoratorArguments(decorator);
//   if (args.length === 0) {
//     return null;
//   }
//   return args[0].getText(sourceFile);
// }

// function stripQuotes(raw: string): string {
//   return raw.replace(/^['"`]/, '').replace(/['"`]$/, '');
// }

// function normalizePath(raw: string): string {
//   const normalized = raw
//     .replace(/\\/g, '/')
//     .replace(/\/+/g, '/')
//     .replace(/\/+$/, '');
//   if (normalized === '') {
//     return '/';
//   }
//   return normalized.startsWith('/') ? normalized : `/${normalized}`;
// }

// function resolveGlobalPrefix(rootDir: string): string {
//   if (process.env.GLOBAL_PREFIX && process.env.GLOBAL_PREFIX.trim().length > 0) {
//     return process.env.GLOBAL_PREFIX.trim().replace(/^\/+/, '').replace(/\/+$/, '');
//   }

//   const envPath = path.join(rootDir, '.env');
//   if (fs.existsSync(envPath)) {
//     const envContent = fs.readFileSync(envPath, 'utf8');
//     const envValue = readEnvValue(envContent, 'GLOBAL_PREFIX');
//     if (envValue) {
//       return envValue.replace(/^\/+/, '').replace(/\/+$/, '');
//     }
//   }

//   const baseConfigPath = path.join(rootDir, 'src', 'config', 'base.config.ts');
//   if (fs.existsSync(baseConfigPath)) {
//     const content = fs.readFileSync(baseConfigPath, 'utf8');
//     const match = content.match(/GLOBAL_PREFIX\s*=\s*process\.env\[['"]GLOBAL_PREFIX['"]]\s*\|\|\s*['"]([^'"]+)['"]/);
//     if (match?.[1]) {
//       return match[1];
//     }
//   }

//   return 'api/v1';
// }

// function readEnvValue(content: string, key: string): string | null {
//   const lines = content.split(/\r?\n/g);
//   for (const line of lines) {
//     const trimmed = line.trim();
//     if (trimmed === '' || trimmed.startsWith('#')) {
//       continue;
//     }
//     const index = trimmed.indexOf('=');
//     if (index <= 0) {
//       continue;
//     }
//     const parsedKey = trimmed.slice(0, index).trim();
//     if (parsedKey !== key) {
//       continue;
//     }
//     const rawValue = trimmed.slice(index + 1).trim();
//     return rawValue.replace(/^['"]/, '').replace(/['"]$/, '');
//   }
//   return null;
// }

// function readGitCommit(rootDir: string): string | null {
//   try {
//     return execSync('git rev-parse HEAD', { cwd: rootDir, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
//   } catch {
//     return null;
//   }
// }

// function resolveGeneratedAt(rootDir: string, sourceCommit: string | null): string {
//   if (sourceCommit) {
//     try {
//       const commitIso = execSync(`git show -s --format=%cI ${sourceCommit}`, {
//         cwd: rootDir,
//         stdio: ['ignore', 'pipe', 'ignore'],
//         encoding: 'utf8',
//       }).trim();
//       if (commitIso.length > 0) {
//         return commitIso;
//       }
//     } catch {
//       // fall through
//     }
//   }
//   return new Date().toISOString();
// }

// function createDecoratorContext(decorators: ts.Decorator[], sourceFile: ts.SourceFile, permissionMap: Map<string, string>) {
//   const names = new Set<string>();
//   const guards: string[] = [];
//   const permissions: string[] = [];

//   for (const decorator of decorators) {
//     const decoratorName = getDecoratorName(decorator);
//     names.add(decoratorName);

//     if (decoratorName === 'UseGuards') {
//       for (const arg of getDecoratorArguments(decorator)) {
//         guards.push(stripQuotes(arg.getText(sourceFile)));
//       }
//       continue;
//     }
//     if (decoratorName === 'RequirePermissions') {
//       const arg = getDecoratorArguments(decorator)[0];
//       if (!arg) {
//         continue;
//       }
//       const text = arg.getText(sourceFile);
//       const resolved = resolvePermissionText(text, permissionMap);
//       permissions.push(resolved);
//     }
//   }

//   return {
//     names,
//     guards: dedupe(guards),
//     permissions: dedupe(permissions),
//   };
// }

// function resolvePermissionText(text: string, permissionMap: Map<string, string>): string {
//   const trimmed = text.trim();
//   const match = trimmed.match(/^PermissionCode\.([A-Z0-9_]+)$/);
//   if (!match?.[1]) {
//     return stripQuotes(trimmed);
//   }
//   const mapped = permissionMap.get(match[1]);
//   return mapped ?? match[1];
// }

// function buildSecurityContract(
//   classContext: ReturnType<typeof createDecoratorContext>,
//   methodContext: ReturnType<typeof createDecoratorContext>,
//   member: ts.MethodDeclaration,
//   sourceFile: ts.SourceFile,
// ): SecurityContract {
//   const allNames = new Set<string>([...classContext.names, ...methodContext.names]);
//   const guards = dedupe([...classContext.guards, ...methodContext.guards]).sort();
//   const permissions = dedupe([...classContext.permissions, ...methodContext.permissions]).sort();
//   const customDecorators = new Set<string>();

//   for (const parameter of member.parameters) {
//     for (const decorator of getDecorators(parameter)) {
//       const name = getDecoratorName(decorator);
//       if (CUSTOM_PARAMETER_DECORATORS.has(name)) {
//         customDecorators.add(name);
//       }
//     }
//   }

//   let accessMode: AccessMode = 'auth';
//   if (allNames.has('Refresh')) {
//     accessMode = 'refresh';
//   } else if (guards.some((guard) => guard.includes('ShopperSessionGuard'))) {
//     accessMode = 'shopper_session';
//   } else if (allNames.has('Public')) {
//     accessMode = 'public';
//   }

//   let bearerRequired = false;
//   if (allNames.has('ApiBearerAuth')) {
//     bearerRequired = true;
//   } else if (accessMode === 'auth') {
//     bearerRequired = true;
//   }
//   if (accessMode === 'refresh' || accessMode === 'shopper_session') {
//     bearerRequired = false;
//   }

//   if (allNames.has('ApiBearerAuth')) {
//     customDecorators.add('ApiBearerAuth');
//   }
//   if (allNames.has('Refresh')) {
//     customDecorators.add('Refresh');
//   }
//   if (allNames.has('Public')) {
//     customDecorators.add('Public');
//   }
//   if (allNames.has('RequirePermissions')) {
//     customDecorators.add('RequirePermissions');
//   }

//   return {
//     accessMode,
//     bearerRequired,
//     permissions,
//     guards,
//     customDecorators: [...customDecorators].sort(),
//   };
// }

// function extractParseBigIntTargets(member: ts.MethodDeclaration): Set<string> {
//   const targets = new Set<string>();
//   if (!member.body) {
//     return targets;
//   }

//   const visitor = (node: ts.Node) => {
//     if (
//       ts.isCallExpression(node) &&
//       ts.isPropertyAccessExpression(node.expression) &&
//       node.expression.name.text === 'parseBigInt' &&
//       node.arguments.length > 0 &&
//       ts.isIdentifier(node.arguments[0])
//     ) {
//       targets.add(node.arguments[0].text);
//     }
//     node.forEachChild(visitor);
//   };

//   member.body.forEachChild(visitor);
//   return targets;
// }

// function buildRequestContract(input: {
//   member: ts.MethodDeclaration;
//   sourceFile: ts.SourceFile;
//   checker: ts.TypeChecker;
//   schemaRegistry: SchemaRegistry;
//   parseBigIntTargets: Set<string>;
//   fullPath: string;
//   security: SecurityContract;
//   warnings: string[];
// }): RequestContract {
//   const { member, sourceFile, schemaRegistry, parseBigIntTargets, fullPath, security } = input;

//   const pathParams: ContractField[] = [];
//   const queryFields: ContractField[] = [];
//   const headerFields: ContractField[] = [];
//   const cookieFields: ContractField[] = [];
//   let querySchemaRef: string | null = null;
//   let querySchemaFields: ContractField[] = [];
//   let bodyContract: RequestContract['body'] = null;

//   for (const parameter of member.parameters) {
//     const parameterTypeText = parameter.type ? normalizeTypeText(parameter.type.getText(sourceFile)) : 'any';
//     const parameterName = ts.isIdentifier(parameter.name) ? parameter.name.text : parameter.name.getText(sourceFile);
//     const parameterDecorators = getDecorators(parameter);

//     for (const decorator of parameterDecorators) {
//       const decoratorName = getDecoratorName(decorator);
//       const decoratorArgs = getDecoratorArguments(decorator);
//       const firstArgText = decoratorArgs[0] ? stripQuotes(decoratorArgs[0].getText(sourceFile)) : null;

//       if (decoratorName === 'Param') {
//         const fieldName = firstArgText && firstArgText.length > 0 ? firstArgText : parameterName;
//         const analysis = analyzeTypeFromText(parameterTypeText);
//         const validators: ValidatorRule[] = [];
//         if (parseBigIntTargets.has(parameterName)) {
//           validators.push({ name: 'BigIntLikeString', args: [] });
//         }
//         const field: ContractField = {
//           name: fieldName,
//           in: 'path',
//           required: true,
//           wireType: 'string',
//           sourceType: parameterTypeText,
//           schemaRef: null,
//           validators,
//           nullable: false,
//           optional: false,
//           array: false,
//           format: parseBigIntTargets.has(parameterName) ? 'bigint' : analysis.format,
//           zodHint: parseBigIntTargets.has(parameterName) ? 'z.string().regex(/^-?\\d+$/)' : analysisToZodHint(analysis, []),
//         };
//         pathParams.push(field);
//         continue;
//       }

//       if (decoratorName === 'Query') {
//         if (firstArgText && firstArgText.length > 0) {
//           const analysis = analyzeTypeFromText(parameterTypeText);
//           queryFields.push({
//             name: firstArgText,
//             in: 'query',
//             required: !parameter.questionToken,
//             wireType: analysis.wireType,
//             sourceType: analysis.sourceType,
//             schemaRef: null,
//             validators: [],
//             nullable: analysis.nullable,
//             optional: !!parameter.questionToken,
//             array: analysis.array,
//             enumValues: analysis.enumValues.length > 0 ? analysis.enumValues : undefined,
//             format: analysis.format,
//             zodHint: analysisToZodHint(analysis, []),
//           });
//           continue;
//         }

//         if (isPrimitiveTypeName(parameterTypeText)) {
//           const analysis = analyzeTypeFromText(parameterTypeText);
//           queryFields.push({
//             name: parameterName,
//             in: 'query',
//             required: !parameter.questionToken,
//             wireType: analysis.wireType,
//             sourceType: analysis.sourceType,
//             schemaRef: null,
//             validators: [],
//             nullable: analysis.nullable,
//             optional: !!parameter.questionToken,
//             array: analysis.array,
//             enumValues: analysis.enumValues.length > 0 ? analysis.enumValues : undefined,
//             format: analysis.format,
//             zodHint: analysisToZodHint(analysis, []),
//           });
//           continue;
//         }

//         querySchemaRef = schemaRegistry.ensureSchemaByTypeName(parameterTypeText, sourceFile.fileName);
//         if (querySchemaRef) {
//           querySchemaFields = schemaRegistry.schemaPropertiesAsFields(querySchemaRef, 'query');
//         }
//         continue;
//       }

//       if (decoratorName === 'Body') {
//         const analysis = analyzeTypeFromText(parameterTypeText);
//         const schemaRef = schemaRegistry.ensureSchemaByTypeName(parameterTypeText, sourceFile.fileName);
//         let fields: ContractField[] = [];
//         if (schemaRef) {
//           fields = schemaRegistry.schemaPropertiesAsFields(schemaRef, 'body');
//         }
//         bodyContract = {
//           required: true,
//           sourceType: parameterTypeText,
//           wireType: analysis.wireType,
//           schemaRef,
//           fields,
//           implicit: false,
//         };
//         continue;
//       }

//       if (decoratorName === 'GetAccessToken') {
//         headerFields.push({
//           name: 'Authorization',
//           in: 'header',
//           required: true,
//           wireType: 'string',
//           sourceType: parameterTypeText,
//           schemaRef: null,
//           validators: [{ name: 'BearerToken', args: [] }],
//           nullable: false,
//           optional: false,
//           array: false,
//           zodHint: 'z.string().startsWith("Bearer ")',
//         });
//         continue;
//       }

//       if (decoratorName === 'UserAgent') {
//         headerFields.push({
//           name: 'User-Agent',
//           in: 'header',
//           required: false,
//           wireType: 'string',
//           sourceType: parameterTypeText,
//           schemaRef: null,
//           validators: [],
//           nullable: false,
//           optional: true,
//           array: false,
//           zodHint: 'z.string().optional()',
//         });
//         continue;
//       }

//       if (decoratorName === 'GetOriginUrl') {
//         headerFields.push({
//           name: 'x-origin-url',
//           in: 'header',
//           required: false,
//           wireType: 'string',
//           sourceType: 'string',
//           schemaRef: null,
//           validators: [],
//           default: 'localhost:3001',
//           nullable: false,
//           optional: true,
//           array: false,
//           zodHint: 'z.string().optional()',
//         });
//       }
//     }
//   }

//   if (security.accessMode === 'shopper_session') {
//     cookieFields.push({
//       name: 'guestSessionId',
//       in: 'cookie',
//       required: false,
//       wireType: 'string',
//       sourceType: 'string',
//       schemaRef: null,
//       validators: [],
//       nullable: false,
//       optional: true,
//       array: false,
//       zodHint: 'z.string().optional()',
//     });
//   }

//   if (fullPath === '/api/v1/auth/login') {
//     cookieFields.push({
//       name: 'device_fingerprint',
//       in: 'cookie',
//       required: false,
//       wireType: 'string',
//       sourceType: 'string',
//       schemaRef: null,
//       validators: [],
//       nullable: false,
//       optional: true,
//       array: false,
//       zodHint: 'z.string().optional()',
//     });
//   }

//   if (fullPath === '/api/v1/auth/refresh-token' && !bodyContract) {
//     const implicitSchemaName = 'ImplicitRefreshTokenBody';
//     schemaRegistry.ensureInlineSchema(implicitSchemaName, {
//       sourceType: '{ refreshToken: string }',
//       properties: {
//         refreshToken: {
//           sourceType: 'string',
//           wireType: 'string',
//           schemaRef: null,
//           required: true,
//           optional: false,
//           nullable: false,
//           array: false,
//           validators: [{ name: 'IsString', args: [] }, { name: 'IsNotEmpty', args: [] }],
//           zodHint: 'z.string().min(1)',
//         },
//       },
//       required: ['refreshToken'],
//       zodHint: 'z.object({ refreshToken: z.string().min(1) })',
//     });
//     bodyContract = {
//       required: true,
//       sourceType: 'RefreshTokenRequestDto',
//       wireType: 'object',
//       schemaRef: '#/schemas/ImplicitRefreshTokenBody',
//       fields: schemaRegistry.schemaPropertiesAsFields('#/schemas/ImplicitRefreshTokenBody', 'body'),
//       implicit: true,
//     };
//   }

//   const dedupedHeaders = dedupeByFieldName(headerFields);
//   const dedupedCookies = dedupeByFieldName(cookieFields);
//   const dedupedPathParams = dedupeByFieldName(pathParams);
//   const dedupedQueryFields = dedupeByFieldName([...queryFields, ...querySchemaFields]);

//   return {
//     pathParams: dedupedPathParams,
//     query: {
//       schemaRef: querySchemaRef,
//       fields: dedupedQueryFields,
//     },
//     headers: dedupedHeaders,
//     cookies: dedupedCookies,
//     body: bodyContract,
//   };
// }

// function dedupeByFieldName(fields: ContractField[]): ContractField[] {
//   const map = new Map<string, ContractField>();
//   for (const field of fields) {
//     const key = `${field.in}:${field.name}`;
//     if (!map.has(key)) {
//       map.set(key, field);
//     }
//   }
//   return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
// }

// function buildResponseContract(input: {
//   member: ts.MethodDeclaration;
//   sourceFile: ts.SourceFile;
//   checker: ts.TypeChecker;
//   schemaRegistry: SchemaRegistry;
//   methodDecorators: ts.Decorator[];
//   httpMethod: string;
//   fullPath: string;
//   security: SecurityContract;
//   parseBigIntTargets: Set<string>;
//   warnings: string[];
// }): ResponseContract {
//   const {
//     member,
//     sourceFile,
//     checker,
//     schemaRegistry,
//     methodDecorators,
//     httpMethod,
//     fullPath,
//     security,
//     parseBigIntTargets,
//   } = input;

//   const successStatusCode = resolveStatusCode(httpMethod, methodDecorators, sourceFile);
//   const apiResponse = parseApiResponseMetadata(methodDecorators, sourceFile);

//   let dataSchemaRef: string | null = null;
//   let dataIsArray = false;
//   let dataSource: DataSource = 'TypeInference';
//   let confidence: Confidence = 'low';

//   if (apiResponse.typeName) {
//     dataIsArray = apiResponse.isArray;
//     dataSource = 'ApiOkResponse';
//     confidence = 'high';
//     dataSchemaRef = schemaRegistry.ensureSchemaByTypeName(apiResponse.typeName, sourceFile.fileName);
//   } else {
//     const inferred = inferMethodReturnSchema(member, checker, schemaRegistry, sourceFile.fileName);
//     dataSchemaRef = inferred.schemaRef;
//     dataIsArray = inferred.isArray;
//     confidence = inferred.confidence;
//     dataSource = 'TypeInference';
//   }

//   const setCookies: SuccessResponse['setCookies'] = [];
//   if (fullPath === '/api/v1/auth/login' && httpMethod === 'POST') {
//     setCookies.push({
//       name: 'device_fingerprint',
//       requiredForClient: false,
//       when: 'Cookie missing in request.',
//       options: {
//         httpOnly: true,
//         sameSite: 'lax',
//         path: '/',
//         secure: 'depends-on-NODE_ENV',
//       },
//     });
//   }
//   if (security.accessMode === 'shopper_session') {
//     setCookies.push({
//       name: 'guestSessionId',
//       requiredForClient: false,
//       when: 'No valid auth token or guest session was missing/expired.',
//       options: {
//         httpOnly: true,
//         sameSite: 'lax',
//         path: '/',
//         secure: 'NODE_ENV=production',
//         maxAge: 432000000,
//       },
//     });
//   }

//   const errors: RouteError[] = [
//     {
//       ref: '#/errors/httpExceptionFilter',
//       statusCodes: [400, 401, 403, 404, 409, 422, 500],
//       description: 'Global HttpException filter envelope.',
//     },
//     {
//       ref: '#/errors/prismaExceptionFilter',
//       statusCodes: [400, 404, 409],
//       description: 'Global Prisma exception filter variants.',
//     },
//   ];

//   if (security.bearerRequired) {
//     errors.push({
//       ref: '#/errors/httpExceptionFilter',
//       statusCodes: [401],
//       description: 'Unauthorized when access token is missing/invalid/revoked.',
//     });
//   }
//   if (security.permissions.length > 0) {
//     errors.push({
//       ref: '#/errors/httpExceptionFilter',
//       statusCodes: [403],
//       description: 'Forbidden when permission check fails.',
//     });
//   }
//   if (security.accessMode === 'refresh') {
//     errors.push({
//       ref: '#/errors/httpExceptionFilter',
//       statusCodes: [401],
//       description: 'Unauthorized when refresh token is missing/expired/revoked.',
//     });
//   }
//   for (const paramName of parseBigIntTargets) {
//     errors.push({
//       ref: '#/errors/httpExceptionFilter',
//       statusCodes: [400],
//       description: `BadRequest when ${paramName} is missing or not bigint-like.`,
//     });
//   }

//   return {
//     success: [
//       {
//         statusCode: successStatusCode,
//         envelope: {
//           wrapper: 'ResponseDto',
//           fields: {
//             success: 'true',
//             statusCode: 'number',
//             message: 'string',
//             data: 'unknown',
//           },
//         },
//         dataSchemaRef,
//         dataSource,
//         confidence,
//         dataIsArray,
//         setCookies,
//       },
//     ],
//     errors,
//   };
// }

// function parseApiResponseMetadata(
//   decorators: ts.Decorator[],
//   sourceFile: ts.SourceFile,
// ): {
//   typeName: string | null;
//   isArray: boolean;
// } {
//   const apiDecoratorNames = ['ApiOkResponse', 'ApiCreatedResponse', 'ApiResponse', 'ApiAcceptedResponse'];
//   for (const decorator of decorators) {
//     const name = getDecoratorName(decorator);
//     if (!apiDecoratorNames.includes(name)) {
//       continue;
//     }
//     const args = getDecoratorArguments(decorator);
//     if (args.length === 0 || !ts.isObjectLiteralExpression(args[0])) {
//       continue;
//     }
//     let typeName: string | null = null;
//     let isArray = false;

//     for (const property of args[0].properties) {
//       if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
//         continue;
//       }
//       const key = property.name.text;
//       if (key === 'type') {
//         const parsed = parseTypeExpressionFromApiResponse(property.initializer.getText(sourceFile));
//         typeName = parsed.typeName;
//         isArray = parsed.isArray;
//       }
//       if (key === 'isArray') {
//         const value = literalExpressionToValue(property.initializer);
//         if (typeof value === 'boolean') {
//           isArray = value;
//         }
//       }
//     }

//     if (typeName) {
//       return { typeName, isArray };
//     }
//   }

//   return { typeName: null, isArray: false };
// }

// function parseTypeExpressionFromApiResponse(typeExpressionText: string): { typeName: string | null; isArray: boolean } {
//   let raw = typeExpressionText.trim();
//   let isArray = false;

//   if (raw.startsWith('() =>')) {
//     raw = raw.slice('() =>'.length).trim();
//   }
//   if (raw.startsWith('[') && raw.endsWith(']')) {
//     raw = raw.slice(1, -1).trim();
//     isArray = true;
//   }
//   if (raw.endsWith('[]')) {
//     raw = raw.slice(0, -2).trim();
//     isArray = true;
//   }
//   const responseDtoMatch = raw.match(/^ResponseDto\s*<(.+)>$/);
//   if (responseDtoMatch?.[1]) {
//     raw = responseDtoMatch[1].trim();
//   }
//   const normalized = normalizeTypeText(raw);
//   if (normalized === '' || normalized === 'void' || normalized === 'any' || normalized === 'unknown') {
//     return { typeName: null, isArray };
//   }
//   return { typeName: normalized, isArray };
// }

// function resolveStatusCode(httpMethod: string, decorators: ts.Decorator[], sourceFile: ts.SourceFile): number {
//   const httpCodeDecorator = findDecorator(decorators, 'HttpCode');
//   if (httpCodeDecorator) {
//     const firstArg = getDecoratorArguments(httpCodeDecorator)[0];
//     if (firstArg) {
//       const value = resolveStatusExpression(firstArg, sourceFile);
//       if (value !== null) {
//         return value;
//       }
//     }
//   }

//   if (httpMethod === 'POST') {
//     return 201;
//   }
//   return 200;
// }

// function resolveStatusExpression(expression: ts.Expression, sourceFile: ts.SourceFile): number | null {
//   if (ts.isNumericLiteral(expression)) {
//     return Number(expression.text);
//   }
//   if (expression.kind === ts.SyntaxKind.TrueKeyword || expression.kind === ts.SyntaxKind.FalseKeyword) {
//     return null;
//   }
//   const text = expression.getText(sourceFile);
//   const directNumber = Number(text);
//   if (Number.isFinite(directNumber)) {
//     return directNumber;
//   }
//   const match = text.match(/^HttpStatus\.([A-Z_]+)$/);
//   if (match?.[1]) {
//     return HTTP_STATUS_NAME_TO_CODE[match[1]] ?? null;
//   }
//   return null;
// }

// function inferMethodReturnSchema(
//   method: ts.MethodDeclaration,
//   checker: ts.TypeChecker,
//   schemaRegistry: SchemaRegistry,
//   ownerFile: string,
// ): { schemaRef: string | null; isArray: boolean; confidence: Confidence } {
//   const signature = checker.getSignatureFromDeclaration(method);
//   if (!signature) {
//     return { schemaRef: null, isArray: false, confidence: 'low' };
//   }

//   let returnType = checker.getReturnTypeOfSignature(signature);
//   returnType = unwrapReturnType(returnType);
//   if (!returnType) {
//     return { schemaRef: null, isArray: false, confidence: 'low' };
//   }

//   if (isVoidLikeType(returnType, checker)) {
//     return { schemaRef: null, isArray: false, confidence: 'low' };
//   }

//   const arrayInfo = getArrayElementType(returnType, checker);
//   if (arrayInfo.isArray && arrayInfo.elementType) {
//     const schemaRef = schemaRegistry.ensureSchemaFromType(arrayInfo.elementType, `Inferred_${getMethodIdentifier(method)}_Item`, ownerFile);
//     return {
//       schemaRef,
//       isArray: true,
//       confidence: schemaRef ? 'medium' : 'low',
//     };
//   }

//   const schemaRef = schemaRegistry.ensureSchemaFromType(returnType, `Inferred_${getMethodIdentifier(method)}_Response`, ownerFile);
//   return {
//     schemaRef,
//     isArray: false,
//     confidence: schemaRef ? 'medium' : 'low',
//   };
// }

// function getMethodIdentifier(method: ts.MethodDeclaration): string {
//   if (method.name && ts.isIdentifier(method.name)) {
//     return method.name.text;
//   }
//   return 'Method';
// }

// function unwrapReturnType(type: ts.Type): ts.Type {
//   let current = type;
//   for (let i = 0; i < 8; i += 1) {
//     const typeRef = current as ts.TypeReference;
//     const typeArgs = typeRef.typeArguments;
//     if (!typeArgs || typeArgs.length === 0) {
//       return current;
//     }
//     const symbolName = getTypeSymbolName(current);
//     if (symbolName && (WRAPPER_TYPE_NAMES.has(symbolName) || symbolName.startsWith('Prisma__'))) {
//       current = typeArgs[0];
//       continue;
//     }
//     return current;
//   }
//   return current;
// }

// function getArrayElementType(type: ts.Type, checker: ts.TypeChecker): { isArray: boolean; elementType: ts.Type | null } {
//   if (checker.isArrayType(type)) {
//     const typeRef = type as ts.TypeReference;
//     const typeArgs = typeRef.typeArguments ?? [];
//     return { isArray: true, elementType: typeArgs[0] ?? null };
//   }
//   if (checker.isTupleType(type)) {
//     const typeRef = type as ts.TypeReference;
//     const typeArgs = typeRef.typeArguments ?? [];
//     if (typeArgs.length > 0) {
//       return { isArray: true, elementType: typeArgs[0] };
//     }
//   }
//   return { isArray: false, elementType: null };
// }

// function isVoidLikeType(type: ts.Type, checker: ts.TypeChecker): boolean {
//   if ((type.flags & ts.TypeFlags.Void) !== 0 || (type.flags & ts.TypeFlags.Undefined) !== 0 || (type.flags & ts.TypeFlags.Never) !== 0) {
//     return true;
//   }
//   const stringified = normalizeTypeText(checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation));
//   return stringified === 'void' || stringified === 'undefined' || stringified === 'never';
// }

// function buildGlobalErrors() {
//   return {
//     httpExceptionFilter: {
//       sourceFile: 'src/common/filters/http-exception.filter.ts',
//       schema: {
//         success: 'false',
//         statusCode: 'number',
//         message: 'string',
//         path: 'string',
//       },
//       sample: {
//         success: 'false',
//         statusCode: 400,
//         message: 'Bad Request',
//         path: '/api/v1/example',
//       },
//     },
//     prismaExceptionFilter: {
//       sourceFile: 'src/common/filters/prisma-exception.filter.ts',
//       variants: {
//         P2002: {
//           statusCode: 409,
//           message: 'Duplicate value (unique constraint)',
//         },
//         P2025: {
//           statusCode: 404,
//           message: 'Record not found',
//         },
//         fallback: {
//           statusCode: 400,
//           message: 'Prisma known request error',
//           code: 'string',
//         },
//       },
//     },
//   };
// }

// class SchemaRegistry {
//   private readonly rootDir: string;
//   private readonly checker: ts.TypeChecker;
//   private readonly declarationIndex: Map<string, DeclarationEntry[]>;
//   private readonly warnings: string[];
//   private readonly schemas = new Map<string, SchemaEntry>();
//   private readonly building = new Set<string>();

//   constructor(input: {
//     rootDir: string;
//     checker: ts.TypeChecker;
//     declarationIndex: Map<string, DeclarationEntry[]>;
//     warnings: string[];
//   }) {
//     this.rootDir = input.rootDir;
//     this.checker = input.checker;
//     this.declarationIndex = input.declarationIndex;
//     this.warnings = input.warnings;
//   }

//   public ensureSchemaByTypeName(typeName: string, ownerFile: string): string | null {
//     const normalizedTypeName = normalizeTypeText(typeName);
//     if (normalizedTypeName === '' || isPrimitiveTypeName(normalizedTypeName)) {
//       return null;
//     }

//     const analysis = analyzeTypeFromText(normalizedTypeName);
//     if (analysis.schemaTypeName && analysis.schemaTypeName !== normalizedTypeName && !isPrimitiveTypeName(analysis.schemaTypeName)) {
//       return this.ensureSchemaByTypeName(analysis.schemaTypeName, ownerFile);
//     }
//     if (analysis.array && analysis.schemaTypeName) {
//       return this.ensureSchemaByTypeName(analysis.schemaTypeName, ownerFile);
//     }

//     const typeNameForLookup = normalizeTypeReferenceName(analysis.schemaTypeName ?? normalizedTypeName);
//     if (this.schemas.has(typeNameForLookup)) {
//       return `#/schemas/${typeNameForLookup}`;
//     }
//     if (this.building.has(typeNameForLookup)) {
//       return `#/schemas/${typeNameForLookup}`;
//     }

//     const declaration = this.pickDeclaration(typeNameForLookup);
//     if (!declaration) {
//       if (EXTERNAL_ENUM_FALLBACK.has(typeNameForLookup)) {
//         this.schemas.set(typeNameForLookup, {
//           kind: 'enum',
//           sourceFile: null,
//           sourceType: typeNameForLookup,
//           wireType: 'enum',
//           properties: {},
//           required: [],
//           additionalProperties: false,
//           enumValues: [],
//           zodHint: 'z.string()',
//         });
//         return `#/schemas/${typeNameForLookup}`;
//       }
//       this.warnings.push(`Schema declaration not found for type: ${typeNameForLookup} (owner: ${toPosix(path.relative(this.rootDir, ownerFile))})`);
//       this.schemas.set(typeNameForLookup, {
//         kind: 'inline',
//         sourceFile: null,
//         sourceType: normalizedTypeName,
//         wireType: analysis.wireType,
//         properties: {},
//         required: [],
//         additionalProperties: true,
//         zodHint: 'z.unknown()',
//       });
//       return `#/schemas/${typeNameForLookup}`;
//     }

//     this.building.add(typeNameForLookup);
//     try {
//       const entry = this.buildFromDeclaration(typeNameForLookup, declaration);
//       this.schemas.set(typeNameForLookup, entry);
//     } finally {
//       this.building.delete(typeNameForLookup);
//     }

//     return `#/schemas/${typeNameForLookup}`;
//   }

//   public ensureSchemaFromType(type: ts.Type, nameHint: string, ownerFile: string): string | null {
//     const symbolName = getTypeSymbolName(type);
//     if (symbolName && this.declarationIndex.has(symbolName)) {
//       return this.ensureSchemaByTypeName(symbolName, ownerFile);
//     }

//     if (
//       (type.flags & ts.TypeFlags.StringLike) !== 0 ||
//       (type.flags & ts.TypeFlags.NumberLike) !== 0 ||
//       (type.flags & ts.TypeFlags.BooleanLike) !== 0 ||
//       (type.flags & ts.TypeFlags.BigIntLike) !== 0
//     ) {
//       return null;
//     }
//     if ((type.flags & ts.TypeFlags.Null) !== 0 || (type.flags & ts.TypeFlags.Undefined) !== 0 || (type.flags & ts.TypeFlags.Void) !== 0) {
//       return null;
//     }

//     if (type.isUnion()) {
//       const unionTypes = type.types.filter(
//         (unionType) => (unionType.flags & ts.TypeFlags.Null) === 0 && (unionType.flags & ts.TypeFlags.Undefined) === 0,
//       );
//       if (unionTypes.length === 0) {
//         return null;
//       }
//       const allStringLiteral = unionTypes.every((unionType) => (unionType.flags & ts.TypeFlags.StringLiteral) !== 0);
//       if (allStringLiteral) {
//         const enumValues = unionTypes.map((unionType) => (unionType as ts.StringLiteralType).value);
//         const schemaName = this.uniqueSchemaName(sanitizeName(nameHint));
//         this.schemas.set(schemaName, {
//           kind: 'inline',
//           sourceFile: toPosix(path.relative(this.rootDir, ownerFile)),
//           sourceType: unionTypes.map((unionType) => this.checker.typeToString(unionType)).join(' | '),
//           wireType: 'enum',
//           properties: {},
//           required: [],
//           additionalProperties: false,
//           enumValues,
//           zodHint: `z.enum([${enumValues.map((value) => JSON.stringify(value)).join(', ')}])`,
//         });
//         return `#/schemas/${schemaName}`;
//       }
//       const allNumberLiteral = unionTypes.every((unionType) => (unionType.flags & ts.TypeFlags.NumberLiteral) !== 0);
//       if (allNumberLiteral) {
//         const enumValues = unionTypes.map((unionType) => (unionType as ts.NumberLiteralType).value);
//         const schemaName = this.uniqueSchemaName(sanitizeName(nameHint));
//         this.schemas.set(schemaName, {
//           kind: 'inline',
//           sourceFile: toPosix(path.relative(this.rootDir, ownerFile)),
//           sourceType: unionTypes.map((unionType) => this.checker.typeToString(unionType)).join(' | '),
//           wireType: 'enum',
//           properties: {},
//           required: [],
//           additionalProperties: false,
//           enumValues,
//           zodHint: `z.union([${enumValues.map((value) => `z.literal(${value})`).join(', ')}])`,
//         });
//         return `#/schemas/${schemaName}`;
//       }
//       if (unionTypes.length === 1) {
//         return this.ensureSchemaFromType(unionTypes[0], nameHint, ownerFile);
//       }
//       const firstObject = unionTypes.find((unionType) => (unionType.flags & ts.TypeFlags.Object) !== 0);
//       if (firstObject) {
//         return this.ensureSchemaFromType(firstObject, nameHint, ownerFile);
//       }
//       return null;
//     }

//     const rawHint = sanitizeName(nameHint);
//     const schemaName = rawHint.length > 0 ? rawHint : 'InferredType';
//     const finalName = this.uniqueSchemaName(schemaName);
//     if (this.schemas.has(finalName)) {
//       return `#/schemas/${finalName}`;
//     }

//     const properties: Record<string, SchemaProperty> = {};
//     const required: string[] = [];
//     const propertySymbols = this.checker.getPropertiesOfType(type);
//     for (const propertySymbol of propertySymbols) {
//       const declaration = propertySymbol.valueDeclaration ?? propertySymbol.declarations?.[0];
//       if (!declaration) {
//         continue;
//       }
//       const propertyName = propertySymbol.getName();
//       const propertyType = this.checker.getTypeOfSymbolAtLocation(propertySymbol, declaration);
//       const analysis = analyzeTypeFromText(
//         normalizeTypeText(this.checker.typeToString(propertyType, declaration, ts.TypeFormatFlags.NoTruncation)),
//       );

//       let schemaRef: string | null = null;
//       if (analysis.schemaTypeName && !isPrimitiveTypeName(analysis.schemaTypeName)) {
//         schemaRef = this.ensureSchemaByTypeName(analysis.schemaTypeName, ownerFile);
//       } else if ((propertyType.flags & ts.TypeFlags.Object) !== 0 && !analysis.array && analysis.wireType === 'object') {
//         schemaRef = this.ensureSchemaFromType(propertyType, `${finalName}_${propertyName}`, ownerFile);
//       }

//       const optional = (propertySymbol.getFlags() & ts.SymbolFlags.Optional) !== 0;
//       const propertyEntry: SchemaProperty = {
//         sourceType: analysis.sourceType,
//         wireType: analysis.wireType,
//         schemaRef,
//         required: !optional,
//         optional,
//         nullable: analysis.nullable,
//         array: analysis.array,
//         enumValues: analysis.enumValues.length > 0 ? analysis.enumValues : undefined,
//         validators: [],
//         zodHint: analysisToZodHint(analysis, []),
//       };
//       if (analysis.format) {
//         propertyEntry.format = analysis.format;
//       }
//       properties[propertyName] = propertyEntry;
//       if (!optional) {
//         required.push(propertyName);
//       }
//     }

//     this.schemas.set(finalName, {
//       kind: 'inferred',
//       sourceFile: toPosix(path.relative(this.rootDir, ownerFile)),
//       sourceType: this.checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation),
//       wireType: 'object',
//       properties: sortRecord(properties),
//       required: required.sort((a, b) => a.localeCompare(b)),
//       additionalProperties: false,
//       zodHint: 'z.object({ ... })',
//     });

//     return `#/schemas/${finalName}`;
//   }

//   public ensureInlineSchema(
//     name: string,
//     input: {
//       sourceType: string;
//       properties: Record<string, SchemaProperty>;
//       required: string[];
//       zodHint: string;
//     },
//   ) {
//     if (this.schemas.has(name)) {
//       return;
//     }
//     this.schemas.set(name, {
//       kind: 'inline',
//       sourceFile: null,
//       sourceType: input.sourceType,
//       wireType: 'object',
//       properties: sortRecord(input.properties),
//       required: [...input.required].sort((a, b) => a.localeCompare(b)),
//       additionalProperties: false,
//       zodHint: input.zodHint,
//     });
//   }

//   public schemaPropertiesAsFields(schemaRef: string, fieldIn: ContractField['in']): ContractField[] {
//     const schemaName = schemaRef.replace('#/schemas/', '');
//     const schema = this.schemas.get(schemaName);
//     if (!schema || !schema.properties) {
//       return [];
//     }
//     const fields: ContractField[] = [];
//     for (const [name, property] of Object.entries(schema.properties)) {
//       fields.push({
//         name,
//         in: fieldIn,
//         required: property.required,
//         wireType: property.wireType,
//         sourceType: property.sourceType,
//         schemaRef: property.schemaRef,
//         validators: property.validators,
//         example: property.example,
//         enumValues: property.enumValues,
//         default: property.default,
//         nullable: property.nullable,
//         optional: property.optional,
//         array: property.array,
//         format: property.format,
//         zodHint: property.zodHint,
//       });
//     }
//     fields.sort((a, b) => a.name.localeCompare(b.name));
//     return fields;
//   }

//   public getSortedSchemas(): Record<string, SchemaEntry> {
//     const entries = [...this.schemas.entries()].sort((a, b) => a[0].localeCompare(b[0]));
//     const output: Record<string, SchemaEntry> = {};
//     for (const [name, schema] of entries) {
//       output[name] = {
//         ...schema,
//         properties: sortRecord(schema.properties),
//         required: [...schema.required].sort((a, b) => a.localeCompare(b)),
//       };
//     }
//     return output;
//   }

//   private uniqueSchemaName(base: string): string {
//     if (!this.schemas.has(base)) {
//       return base;
//     }
//     let index = 2;
//     while (this.schemas.has(`${base}_${index}`)) {
//       index += 1;
//     }
//     return `${base}_${index}`;
//   }

//   private pickDeclaration(typeName: string): DeclarationEntry | null {
//     const entries = this.declarationIndex.get(typeName);
//     if (!entries || entries.length === 0) {
//       return null;
//     }
//     const preferred = entries.find((entry) => /[\\/]src[\\/]modules[\\/]/.test(entry.sourceFile.fileName));
//     if (preferred) {
//       return preferred;
//     }
//     return entries[0] ?? null;
//   }

//   private buildFromDeclaration(name: string, declaration: DeclarationEntry): SchemaEntry {
//     if (declaration.kind === 'enum') {
//       const enumValues: Array<string | number> = [];
//       const enumNode = declaration.node as ts.EnumDeclaration;
//       for (const member of enumNode.members) {
//         if (!member.initializer) {
//           enumValues.push(member.name.getText(declaration.sourceFile));
//           continue;
//         }
//         const value = literalExpressionToValue(member.initializer);
//         if (typeof value === 'string' || typeof value === 'number') {
//           enumValues.push(value);
//         }
//       }
//       return {
//         kind: 'enum',
//         sourceFile: toPosix(path.relative(this.rootDir, declaration.sourceFile.fileName)),
//         sourceType: name,
//         wireType: 'enum',
//         properties: {},
//         required: [],
//         additionalProperties: false,
//         enumValues,
//         zodHint: enumValues.length > 0 ? `z.enum([${enumValues.map((value) => JSON.stringify(String(value))).join(', ')}])` : 'z.enum([])',
//       };
//     }

//     if (declaration.kind === 'typeAlias') {
//       const typeAliasNode = declaration.node as ts.TypeAliasDeclaration;
//       const type = this.checker.getTypeFromTypeNode(typeAliasNode.type);
//       const sourceType = normalizeTypeText(typeAliasNode.type.getText(declaration.sourceFile));
//       if (ts.isTypeLiteralNode(typeAliasNode.type)) {
//         return this.buildFromTypeLiteral(name, sourceType, typeAliasNode.type, declaration.sourceFile.fileName);
//       }
//       if ((type.flags & ts.TypeFlags.Object) !== 0) {
//         const schemaRef = this.ensureSchemaFromType(type, name, declaration.sourceFile.fileName);
//         if (schemaRef) {
//           const schemaName = schemaRef.replace('#/schemas/', '');
//           const existing = this.schemas.get(schemaName);
//           if (existing) {
//             return {
//               ...existing,
//               kind: 'typeAlias',
//               sourceFile: toPosix(path.relative(this.rootDir, declaration.sourceFile.fileName)),
//               sourceType,
//             };
//           }
//         }
//       }
//       const analysis = analyzeTypeFromText(sourceType);
//       return {
//         kind: 'typeAlias',
//         sourceFile: toPosix(path.relative(this.rootDir, declaration.sourceFile.fileName)),
//         sourceType,
//         wireType: analysis.wireType,
//         properties: {},
//         required: [],
//         additionalProperties: true,
//         zodHint: analysisToZodHint(analysis, []),
//       };
//     }

//     if (declaration.kind === 'interface') {
//       const interfaceNode = declaration.node as ts.InterfaceDeclaration;
//       const properties: Record<string, SchemaProperty> = {};
//       const required: string[] = [];
//       for (const member of interfaceNode.members) {
//         if (!ts.isPropertySignature(member) || !member.name) {
//           continue;
//         }
//         const propertyName = member.name.getText(declaration.sourceFile);
//         const typeText = member.type ? normalizeTypeText(member.type.getText(declaration.sourceFile)) : 'unknown';
//         const analysis = member.type ? analyzeTypeNode(member.type, declaration.sourceFile) : analyzeTypeFromText(typeText);
//         let schemaRef: string | null = null;
//         if (analysis.schemaTypeName && !isPrimitiveTypeName(analysis.schemaTypeName)) {
//           schemaRef = this.ensureSchemaByTypeName(analysis.schemaTypeName, declaration.sourceFile.fileName);
//         }
//         const optional = !!member.questionToken;
//         properties[propertyName] = {
//           sourceType: analysis.sourceType,
//           wireType: analysis.wireType,
//           schemaRef,
//           required: !optional,
//           optional,
//           nullable: analysis.nullable,
//           array: analysis.array,
//           format: analysis.format,
//           enumValues: analysis.enumValues.length > 0 ? analysis.enumValues : undefined,
//           validators: [],
//           zodHint: analysisToZodHint(analysis, []),
//         };
//         if (!optional) {
//           required.push(propertyName);
//         }
//       }
//       return {
//         kind: 'interface',
//         sourceFile: toPosix(path.relative(this.rootDir, declaration.sourceFile.fileName)),
//         sourceType: name,
//         wireType: 'object',
//         properties: sortRecord(properties),
//         required: required.sort((a, b) => a.localeCompare(b)),
//         additionalProperties: false,
//         zodHint: 'z.object({ ... })',
//       };
//     }

//     const classNode = declaration.node as ts.ClassDeclaration;
//     const properties: Record<string, SchemaProperty> = {};
//     const required: string[] = [];

//     for (const member of classNode.members) {
//       if (!ts.isPropertyDeclaration(member) || !member.name) {
//         continue;
//       }

//       const propertyName = member.name.getText(declaration.sourceFile);
//       const typeNode = member.type;
//       const sourceTypeText = typeNode ? normalizeTypeText(typeNode.getText(declaration.sourceFile)) : 'unknown';
//       const analysis = typeNode ? analyzeTypeNode(typeNode, declaration.sourceFile) : analyzeTypeFromText(sourceTypeText);
//       const apiMeta = parseApiPropertyMetadata(member, declaration.sourceFile, this.checker, this.declarationIndex);
//       const validators = parseValidatorDecorators(member, declaration.sourceFile);
//       const optionalFromNode = !!member.questionToken;

//       let requiredByMeta = !optionalFromNode;
//       if (typeof apiMeta.required === 'boolean') {
//         requiredByMeta = apiMeta.required;
//       }
//       if (findDecorator(getDecorators(member), 'ApiPropertyOptional')) {
//         requiredByMeta = false;
//       }
//       if (validators.some((validator) => validator.name === 'IsOptional')) {
//         requiredByMeta = false;
//       }

//       const nullable = Boolean(apiMeta.nullable) || analysis.nullable;
//       const enumValues = apiMeta.enumValues && apiMeta.enumValues.length > 0 ? apiMeta.enumValues : analysis.enumValues;

//       let schemaRef: string | null = null;
//       const schemaTypeName = analysis.schemaTypeName;
//       if (schemaTypeName && !isPrimitiveTypeName(schemaTypeName)) {
//         schemaRef = this.ensureSchemaByTypeName(schemaTypeName, declaration.sourceFile.fileName);
//       }

//       const finalAnalysis: TypeAnalysis = {
//         ...analysis,
//         nullable,
//         optional: !requiredByMeta,
//         enumValues: enumValues ?? [],
//         array: Boolean(apiMeta.isArray) || analysis.array,
//         wireType: Boolean(apiMeta.isArray) || analysis.array ? 'array' : analysis.wireType,
//       };

//       const schemaProperty: SchemaProperty = {
//         sourceType: finalAnalysis.sourceType,
//         wireType: finalAnalysis.wireType,
//         schemaRef,
//         required: requiredByMeta,
//         optional: !requiredByMeta,
//         nullable,
//         array: finalAnalysis.array,
//         enumValues: finalAnalysis.enumValues.length > 0 ? finalAnalysis.enumValues : undefined,
//         validators,
//         example: apiMeta.example,
//         default: apiMeta.default,
//         zodHint: analysisToZodHint(finalAnalysis, validators),
//       };
//       if (finalAnalysis.format) {
//         schemaProperty.format = finalAnalysis.format;
//       }
//       properties[propertyName] = schemaProperty;
//       if (requiredByMeta) {
//         required.push(propertyName);
//       }
//     }

//     return {
//       kind: 'class',
//       sourceFile: toPosix(path.relative(this.rootDir, declaration.sourceFile.fileName)),
//       sourceType: name,
//       wireType: 'object',
//       properties: sortRecord(properties),
//       required: required.sort((a, b) => a.localeCompare(b)),
//       additionalProperties: false,
//       zodHint: 'z.object({ ... })',
//     };
//   }

//   private buildFromTypeLiteral(name: string, sourceType: string, node: ts.TypeLiteralNode, ownerFile: string): SchemaEntry {
//     const properties: Record<string, SchemaProperty> = {};
//     const required: string[] = [];

//     for (const member of node.members) {
//       if (!ts.isPropertySignature(member) || !member.name) {
//         continue;
//       }
//       const propertyName = member.name.getText(node.getSourceFile());
//       const analysis = member.type ? analyzeTypeNode(member.type, node.getSourceFile()) : analyzeTypeFromText('unknown');
//       let schemaRef: string | null = null;
//       if (analysis.schemaTypeName && !isPrimitiveTypeName(analysis.schemaTypeName)) {
//         schemaRef = this.ensureSchemaByTypeName(analysis.schemaTypeName, ownerFile);
//       }
//       const optional = !!member.questionToken;
//       properties[propertyName] = {
//         sourceType: analysis.sourceType,
//         wireType: analysis.wireType,
//         schemaRef,
//         required: !optional,
//         optional,
//         nullable: analysis.nullable,
//         array: analysis.array,
//         enumValues: analysis.enumValues.length > 0 ? analysis.enumValues : undefined,
//         validators: [],
//         zodHint: analysisToZodHint(analysis, []),
//       };
//       if (!optional) {
//         required.push(propertyName);
//       }
//     }

//     return {
//       kind: 'typeAlias',
//       sourceFile: toPosix(path.relative(this.rootDir, ownerFile)),
//       sourceType,
//       wireType: 'object',
//       properties: sortRecord(properties),
//       required: required.sort((a, b) => a.localeCompare(b)),
//       additionalProperties: false,
//       zodHint: 'z.object({ ... })',
//     };
//   }
// }

// function parseApiPropertyMetadata(
//   property: ts.PropertyDeclaration,
//   sourceFile: ts.SourceFile,
//   checker: ts.TypeChecker,
//   declarationIndex: Map<string, DeclarationEntry[]>,
// ): ApiPropertyMeta {
//   const decorators = getDecorators(property);
//   const apiDecorator = decorators.find((decorator) => {
//     const name = getDecoratorName(decorator);
//     return name === 'ApiProperty' || name === 'ApiPropertyOptional';
//   });

//   const meta: ApiPropertyMeta = {};
//   if (!apiDecorator) {
//     return meta;
//   }

//   const decoratorName = getDecoratorName(apiDecorator);
//   if (decoratorName === 'ApiPropertyOptional') {
//     meta.required = false;
//   }

//   const args = getDecoratorArguments(apiDecorator);
//   if (args.length === 0 || !ts.isObjectLiteralExpression(args[0])) {
//     return meta;
//   }

//   for (const objectProp of args[0].properties) {
//     if (!ts.isPropertyAssignment(objectProp)) {
//       continue;
//     }
//     const key = objectProp.name.getText(sourceFile);
//     if (key === 'required') {
//       const requiredValue = literalExpressionToValue(objectProp.initializer);
//       if (typeof requiredValue === 'boolean') {
//         meta.required = requiredValue;
//       }
//       continue;
//     }
//     if (key === 'nullable') {
//       const nullableValue = literalExpressionToValue(objectProp.initializer);
//       if (typeof nullableValue === 'boolean') {
//         meta.nullable = nullableValue;
//       }
//       continue;
//     }
//     if (key === 'isArray') {
//       const arrayValue = literalExpressionToValue(objectProp.initializer);
//       if (typeof arrayValue === 'boolean') {
//         meta.isArray = arrayValue;
//       }
//       continue;
//     }
//     if (key === 'example') {
//       meta.example = literalExpressionToValue(objectProp.initializer);
//       continue;
//     }
//     if (key === 'default') {
//       meta.default = literalExpressionToValue(objectProp.initializer);
//       continue;
//     }
//     if (key === 'enum') {
//       const values = resolveEnumValuesFromExpression(objectProp.initializer, sourceFile, checker, declarationIndex);
//       if (values.length > 0) {
//         meta.enumValues = values;
//       }
//       continue;
//     }
//   }

//   return meta;
// }

// function parseValidatorDecorators(property: ts.PropertyDeclaration, sourceFile: ts.SourceFile): ValidatorRule[] {
//   const validators: ValidatorRule[] = [];
//   const decorators = getDecorators(property);
//   for (const decorator of decorators) {
//     const name = getDecoratorName(decorator);
//     if (!CLASS_VALIDATOR_DECORATORS.has(name)) {
//       continue;
//     }
//     const args = getDecoratorArguments(decorator).map((arg) => arg.getText(sourceFile));
//     validators.push({ name, args });
//   }
//   return validators;
// }

// function resolveEnumValuesFromExpression(
//   expression: ts.Expression,
//   sourceFile: ts.SourceFile,
//   checker: ts.TypeChecker,
//   declarationIndex: Map<string, DeclarationEntry[]>,
// ): Array<string | number> {
//   if (ts.isArrayLiteralExpression(expression)) {
//     const values: Array<string | number> = [];
//     for (const element of expression.elements) {
//       const value = literalExpressionToValue(element);
//       if (typeof value === 'string' || typeof value === 'number') {
//         values.push(value);
//       }
//     }
//     return values;
//   }

//   const text = normalizeTypeText(expression.getText(sourceFile));
//   if (text.includes('.') && !text.startsWith('import(')) {
//     const right = text.split('.').pop() ?? text;
//     const left = text.split('.')[0];
//     if (declarationIndex.has(left)) {
//       const enumDeclaration = declarationIndex.get(left)?.find((entry) => entry.kind === 'enum');
//       if (enumDeclaration && ts.isEnumDeclaration(enumDeclaration.node)) {
//         const values: Array<string | number> = [];
//         for (const member of enumDeclaration.node.members) {
//           if (!member.initializer) {
//             values.push(member.name.getText(enumDeclaration.sourceFile));
//           } else {
//             const value = literalExpressionToValue(member.initializer);
//             if (typeof value === 'string' || typeof value === 'number') {
//               values.push(value);
//             }
//           }
//         }
//         return values;
//       }
//     }
//     return [right];
//   }

//   const type = checker.getTypeAtLocation(expression);
//   if (type.isUnion()) {
//     const values: Array<string | number> = [];
//     for (const subtype of type.types) {
//       if ((subtype.flags & ts.TypeFlags.StringLiteral) !== 0) {
//         values.push((subtype as ts.StringLiteralType).value);
//       }
//       if ((subtype.flags & ts.TypeFlags.NumberLiteral) !== 0) {
//         values.push((subtype as ts.NumberLiteralType).value);
//       }
//     }
//     if (values.length > 0) {
//       return values;
//     }
//   }

//   if ((type.flags & ts.TypeFlags.Enum) !== 0 || (type.flags & ts.TypeFlags.EnumLiteral) !== 0) {
//     const symbol = type.getSymbol();
//     if (symbol?.declarations?.length) {
//       for (const declaration of symbol.declarations) {
//         if (ts.isEnumDeclaration(declaration)) {
//           const values: Array<string | number> = [];
//           for (const member of declaration.members) {
//             if (!member.initializer) {
//               values.push(member.name.getText(declaration.getSourceFile()));
//             } else {
//               const value = literalExpressionToValue(member.initializer);
//               if (typeof value === 'string' || typeof value === 'number') {
//                 values.push(value);
//               }
//             }
//           }
//           return values;
//         }
//       }
//     }
//   }

//   return [];
// }

// function literalExpressionToValue(expression: ts.Expression | ts.Node): unknown {
//   if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
//     return expression.text;
//   }
//   if (ts.isNumericLiteral(expression)) {
//     return Number(expression.text);
//   }
//   if (expression.kind === ts.SyntaxKind.TrueKeyword) {
//     return true;
//   }
//   if (expression.kind === ts.SyntaxKind.FalseKeyword) {
//     return false;
//   }
//   if (expression.kind === ts.SyntaxKind.NullKeyword) {
//     return null;
//   }
//   if (ts.isArrayLiteralExpression(expression)) {
//     return expression.elements.map((element) => literalExpressionToValue(element));
//   }
//   if (ts.isObjectLiteralExpression(expression)) {
//     const output: Record<string, unknown> = {};
//     for (const property of expression.properties) {
//       if (ts.isPropertyAssignment(property)) {
//         const key = property.name.getText(expression.getSourceFile());
//         output[key] = literalExpressionToValue(property.initializer);
//       }
//     }
//     return output;
//   }
//   return expression.getText(expression.getSourceFile());
// }

// function analyzeTypeNode(node: ts.TypeNode, sourceFile: ts.SourceFile): TypeAnalysis {
//   if (ts.isUnionTypeNode(node)) {
//     const nonNullNodes = node.types.filter(
//       (type) => type.kind !== ts.SyntaxKind.NullKeyword && type.kind !== ts.SyntaxKind.UndefinedKeyword,
//     );
//     const nullable = nonNullNodes.length !== node.types.length;
//     if (nonNullNodes.length === 0) {
//       return {
//         sourceType: 'null',
//         wireType: 'null',
//         schemaTypeName: null,
//         nullable: true,
//         optional: false,
//         array: false,
//         enumValues: [],
//       };
//     }
//     const allStringLiteral = nonNullNodes.every(ts.isLiteralTypeNode) && nonNullNodes.every((type) => ts.isStringLiteral(type.literal));
//     if (allStringLiteral) {
//       const enumValues = nonNullNodes.map((type) => (type as ts.LiteralTypeNode).literal).map((literal) => (literal as ts.StringLiteral).text);
//       return {
//         sourceType: normalizeTypeText(node.getText(sourceFile)),
//         wireType: 'string',
//         schemaTypeName: null,
//         nullable,
//         optional: false,
//         array: false,
//         enumValues,
//       };
//     }
//     const first = analyzeTypeNode(nonNullNodes[0], sourceFile);
//     return {
//       ...first,
//       sourceType: normalizeTypeText(node.getText(sourceFile)),
//       nullable: first.nullable || nullable,
//     };
//   }

//   if (ts.isArrayTypeNode(node)) {
//     const inner = analyzeTypeNode(node.elementType, sourceFile);
//     return {
//       sourceType: normalizeTypeText(node.getText(sourceFile)),
//       wireType: 'array',
//       schemaTypeName: inner.schemaTypeName,
//       nullable: false,
//       optional: false,
//       array: true,
//       enumValues: inner.enumValues,
//       format: inner.format,
//     };
//   }

//   if (ts.isLiteralTypeNode(node)) {
//     if (ts.isStringLiteral(node.literal)) {
//       return {
//         sourceType: normalizeTypeText(node.getText(sourceFile)),
//         wireType: 'string',
//         schemaTypeName: null,
//         nullable: false,
//         optional: false,
//         array: false,
//         enumValues: [node.literal.text],
//       };
//     }
//     if (ts.isNumericLiteral(node.literal)) {
//       return {
//         sourceType: normalizeTypeText(node.getText(sourceFile)),
//         wireType: 'number',
//         schemaTypeName: null,
//         nullable: false,
//         optional: false,
//         array: false,
//         enumValues: [Number(node.literal.text)],
//       };
//     }
//   }

//   if (ts.isTypeReferenceNode(node)) {
//     const typeNameText = node.typeName.getText(sourceFile);
//     if (typeNameText === 'Array' && node.typeArguments?.[0]) {
//       const inner = analyzeTypeNode(node.typeArguments[0], sourceFile);
//       return {
//         sourceType: normalizeTypeText(node.getText(sourceFile)),
//         wireType: 'array',
//         schemaTypeName: inner.schemaTypeName,
//         nullable: false,
//         optional: false,
//         array: true,
//         enumValues: inner.enumValues,
//         format: inner.format,
//       };
//     }
//     if (typeNameText === 'Date') {
//       return {
//         sourceType: 'Date',
//         wireType: 'string',
//         schemaTypeName: null,
//         nullable: false,
//         optional: false,
//         array: false,
//         enumValues: [],
//         format: 'date-time',
//       };
//     }
//     if (typeNameText === 'Record') {
//       return {
//         sourceType: normalizeTypeText(node.getText(sourceFile)),
//         wireType: 'object',
//         schemaTypeName: null,
//         nullable: false,
//         optional: false,
//         array: false,
//         enumValues: [],
//       };
//     }
//     if (typeNameText === 'Promise' && node.typeArguments?.[0]) {
//       const inner = analyzeTypeNode(node.typeArguments[0], sourceFile);
//       return {
//         ...inner,
//         sourceType: normalizeTypeText(node.getText(sourceFile)),
//       };
//     }
//     if (typeNameText === 'ResponseDto' && node.typeArguments?.[0]) {
//       const inner = analyzeTypeNode(node.typeArguments[0], sourceFile);
//       return {
//         ...inner,
//         sourceType: normalizeTypeText(node.getText(sourceFile)),
//       };
//     }
//     return {
//       sourceType: normalizeTypeText(node.getText(sourceFile)),
//       wireType: 'object',
//       schemaTypeName: normalizeTypeReferenceName(typeNameText),
//       nullable: false,
//       optional: false,
//       array: false,
//       enumValues: [],
//     };
//   }

//   if (ts.isTypeLiteralNode(node)) {
//     return {
//       sourceType: normalizeTypeText(node.getText(sourceFile)),
//       wireType: 'object',
//       schemaTypeName: null,
//       nullable: false,
//       optional: false,
//       array: false,
//       enumValues: [],
//     };
//   }

//   switch (node.kind) {
//     case ts.SyntaxKind.StringKeyword:
//       return {
//         sourceType: 'string',
//         wireType: 'string',
//         schemaTypeName: null,
//         nullable: false,
//         optional: false,
//         array: false,
//         enumValues: [],
//       };
//     case ts.SyntaxKind.NumberKeyword:
//       return {
//         sourceType: 'number',
//         wireType: 'number',
//         schemaTypeName: null,
//         nullable: false,
//         optional: false,
//         array: false,
//         enumValues: [],
//       };
//     case ts.SyntaxKind.BooleanKeyword:
//       return {
//         sourceType: 'boolean',
//         wireType: 'boolean',
//         schemaTypeName: null,
//         nullable: false,
//         optional: false,
//         array: false,
//         enumValues: [],
//       };
//     case ts.SyntaxKind.BigIntKeyword:
//       return {
//         sourceType: 'bigint',
//         wireType: 'string',
//         schemaTypeName: null,
//         nullable: false,
//         optional: false,
//         array: false,
//         enumValues: [],
//         format: 'bigint',
//       };
//     case ts.SyntaxKind.UnknownKeyword:
//       return {
//         sourceType: 'unknown',
//         wireType: 'unknown',
//         schemaTypeName: null,
//         nullable: false,
//         optional: false,
//         array: false,
//         enumValues: [],
//       };
//     case ts.SyntaxKind.AnyKeyword:
//       return {
//         sourceType: 'any',
//         wireType: 'unknown',
//         schemaTypeName: null,
//         nullable: false,
//         optional: false,
//         array: false,
//         enumValues: [],
//       };
//     case ts.SyntaxKind.NullKeyword:
//       return {
//         sourceType: 'null',
//         wireType: 'null',
//         schemaTypeName: null,
//         nullable: true,
//         optional: false,
//         array: false,
//         enumValues: [],
//       };
//     default:
//       return analyzeTypeFromText(normalizeTypeText(node.getText(sourceFile)));
//   }
// }

// function analyzeTypeFromText(typeTextInput: string): TypeAnalysis {
//   const typeText = normalizeTypeText(typeTextInput);
//   if (typeText === '' || typeText === 'any') {
//     return {
//       sourceType: typeText === '' ? 'unknown' : typeText,
//       wireType: 'unknown',
//       schemaTypeName: null,
//       nullable: false,
//       optional: false,
//       array: false,
//       enumValues: [],
//     };
//   }

//   const unionParts = splitTopLevel(typeText, '|')
//     .map((part) => part.trim())
//     .filter((part) => part.length > 0);
//   const nullable = unionParts.some((part) => part === 'null' || part === 'undefined');
//   const withoutNull = unionParts.filter((part) => part !== 'null' && part !== 'undefined');

//   const unionLiteralValues = withoutNull
//     .map((part) => part.match(/^['"](.+)['"]$/))
//     .filter((match): match is RegExpMatchArray => Boolean(match))
//     .map((match) => match[1]);
//   if (withoutNull.length > 0 && unionLiteralValues.length === withoutNull.length) {
//     return {
//       sourceType: typeText,
//       wireType: 'string',
//       schemaTypeName: null,
//       nullable,
//       optional: false,
//       array: false,
//       enumValues: unionLiteralValues,
//     };
//   }

//   const primaryType = withoutNull[0] ?? typeText;
//   if (primaryType.endsWith('[]')) {
//     const innerText = primaryType.slice(0, -2).trim();
//     const inner = analyzeTypeFromText(innerText);
//     return {
//       sourceType: typeText,
//       wireType: 'array',
//       schemaTypeName: inner.schemaTypeName,
//       nullable,
//       optional: false,
//       array: true,
//       enumValues: inner.enumValues,
//       format: inner.format,
//     };
//   }

//   if (primaryType === 'string') {
//     return {
//       sourceType: typeText,
//       wireType: 'string',
//       schemaTypeName: null,
//       nullable,
//       optional: false,
//       array: false,
//       enumValues: [],
//     };
//   }
//   if (primaryType === 'number') {
//     return {
//       sourceType: typeText,
//       wireType: 'number',
//       schemaTypeName: null,
//       nullable,
//       optional: false,
//       array: false,
//       enumValues: [],
//     };
//   }
//   if (primaryType === 'boolean') {
//     return {
//       sourceType: typeText,
//       wireType: 'boolean',
//       schemaTypeName: null,
//       nullable,
//       optional: false,
//       array: false,
//       enumValues: [],
//     };
//   }
//   if (primaryType === 'bigint') {
//     return {
//       sourceType: typeText,
//       wireType: 'string',
//       schemaTypeName: null,
//       nullable,
//       optional: false,
//       array: false,
//       enumValues: [],
//       format: 'bigint',
//     };
//   }
//   if (primaryType === 'Date') {
//     return {
//       sourceType: typeText,
//       wireType: 'string',
//       schemaTypeName: null,
//       nullable,
//       optional: false,
//       array: false,
//       enumValues: [],
//       format: 'date-time',
//     };
//   }
//   if (primaryType === 'unknown' || primaryType === 'any') {
//     return {
//       sourceType: typeText,
//       wireType: 'unknown',
//       schemaTypeName: null,
//       nullable,
//       optional: false,
//       array: false,
//       enumValues: [],
//     };
//   }
//   if (primaryType.startsWith('{')) {
//     return {
//       sourceType: typeText,
//       wireType: 'object',
//       schemaTypeName: null,
//       nullable,
//       optional: false,
//       array: false,
//       enumValues: [],
//     };
//   }
//   if (primaryType.startsWith('Record<')) {
//     return {
//       sourceType: typeText,
//       wireType: 'object',
//       schemaTypeName: null,
//       nullable,
//       optional: false,
//       array: false,
//       enumValues: [],
//     };
//   }
//   const normalizedReferenceName = normalizeTypeReferenceName(primaryType);
//   return {
//     sourceType: typeText,
//     wireType: 'object',
//     schemaTypeName: normalizedReferenceName,
//     nullable,
//     optional: false,
//     array: false,
//     enumValues: [],
//   };
// }

// function normalizeTypeText(raw: string): string {
//   return raw
//     .replace(/\s+/g, ' ')
//     .replace(/import\("[^"]+"\)\./g, '')
//     .replace(/\$Enums\./g, '')
//     .replace(/\bPrisma\./g, '')
//     .replace(/\bDefaultArgs\b/g, 'unknown')
//     .trim();
// }

// function splitTopLevel(text: string, delimiter: string): string[] {
//   const result: string[] = [];
//   let current = '';
//   let angleDepth = 0;
//   let braceDepth = 0;
//   let bracketDepth = 0;
//   let parenDepth = 0;
//   let quote: "'" | '"' | '`' | null = null;

//   for (let index = 0; index < text.length; index += 1) {
//     const char = text[index];
//     const previous = index > 0 ? text[index - 1] : '';

//     if (quote) {
//       current += char;
//       if (char === quote && previous !== '\\') {
//         quote = null;
//       }
//       continue;
//     }
//     if (char === '\'' || char === '"' || char === '`') {
//       quote = char;
//       current += char;
//       continue;
//     }

//     if (char === '<') angleDepth += 1;
//     else if (char === '>') angleDepth = Math.max(0, angleDepth - 1);
//     else if (char === '{') braceDepth += 1;
//     else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
//     else if (char === '[') bracketDepth += 1;
//     else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
//     else if (char === '(') parenDepth += 1;
//     else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);

//     if (
//       char === delimiter &&
//       angleDepth === 0 &&
//       braceDepth === 0 &&
//       bracketDepth === 0 &&
//       parenDepth === 0
//     ) {
//       result.push(current);
//       current = '';
//       continue;
//     }
//     current += char;
//   }

//   if (current.length > 0) {
//     result.push(current);
//   }
//   return result;
// }

// function normalizeTypeReferenceName(raw: string): string {
//   let text = raw.trim();
//   if (text.startsWith('typeof ')) {
//     text = text.slice('typeof '.length).trim();
//   }
//   if (text.includes('<')) {
//     text = text.slice(0, text.indexOf('<')).trim();
//   }
//   if (text.includes('.')) {
//     text = text.split('.').pop() ?? text;
//   }
//   return text.trim();
// }

// function isPrimitiveTypeName(typeName: string): boolean {
//   const normalized = normalizeTypeReferenceName(typeName);
//   return ['string', 'number', 'boolean', 'bigint', 'Date', 'unknown', 'any', 'void', 'null', 'undefined', 'object'].includes(
//     normalized,
//   );
// }

// function analysisToZodHint(analysis: TypeAnalysis, validators: ValidatorRule[]): string {
//   let hint = 'z.unknown()';
//   if (analysis.enumValues.length > 0) {
//     hint = `z.enum([${analysis.enumValues.map((value) => JSON.stringify(String(value))).join(', ')}])`;
//   } else {
//     switch (analysis.wireType) {
//       case 'string':
//         hint = 'z.string()';
//         break;
//       case 'number':
//         hint = 'z.number()';
//         break;
//       case 'boolean':
//         hint = 'z.boolean()';
//         break;
//       case 'object':
//         hint = analysis.schemaTypeName ? `z.lazy(() => ${analysis.schemaTypeName})` : 'z.object({})';
//         break;
//       case 'array':
//         if (analysis.schemaTypeName) {
//           hint = `z.array(z.lazy(() => ${analysis.schemaTypeName}))`;
//         } else {
//           hint = 'z.array(z.unknown())';
//         }
//         break;
//       case 'unknown':
//         hint = 'z.unknown()';
//         break;
//       case 'null':
//         hint = 'z.null()';
//         break;
//       default:
//         hint = 'z.unknown()';
//         break;
//     }
//   }

//   for (const validator of validators) {
//     if (validator.name === 'IsEmail') {
//       hint += '.email()';
//     }
//     if (validator.name === 'MinLength' && validator.args[0]) {
//       hint += `.min(${validator.args[0]})`;
//     }
//     if (validator.name === 'MaxLength' && validator.args[0]) {
//       hint += `.max(${validator.args[0]})`;
//     }
//     if (validator.name === 'Min' && validator.args[0]) {
//       hint += `.min(${validator.args[0]})`;
//     }
//     if (validator.name === 'Max' && validator.args[0]) {
//       hint += `.max(${validator.args[0]})`;
//     }
//   }

//   if (analysis.nullable) {
//     hint += '.nullable()';
//   }
//   if (analysis.optional) {
//     hint += '.optional()';
//   }
//   if (analysis.format === 'bigint' && analysis.wireType === 'string') {
//     hint += '.regex(/^-?\\d+$/)';
//   }
//   if (analysis.format === 'date-time' && analysis.wireType === 'string') {
//     hint += '.datetime()';
//   }

//   return hint;
// }

// function dedupe(values: string[]): string[] {
//   return [...new Set(values)];
// }

// function sanitizeName(raw: string): string {
//   const replaced = raw.replace(/[^a-zA-Z0-9_]/g, '_');
//   return replaced.replace(/_+/g, '_').replace(/^_+/, '').replace(/_+$/, '');
// }

// function getTypeSymbolName(type: ts.Type): string | null {
//   if (type.aliasSymbol?.name) {
//     return type.aliasSymbol.name;
//   }
//   if (type.symbol?.name) {
//     return type.symbol.name;
//   }
//   const typeRef = type as ts.TypeReference;
//   if (typeRef.target?.symbol?.name) {
//     return typeRef.target.symbol.name;
//   }
//   return null;
// }

// function sortRecord<T>(record: Record<string, T>): Record<string, T> {
//   const keys = Object.keys(record).sort((a, b) => a.localeCompare(b));
//   const output: Record<string, T> = {};
//   for (const key of keys) {
//     output[key] = record[key];
//   }
//   return output;
// }

// function stableStringify(input: unknown): string {
//   const sorted = sortDeep(input);
//   return `${JSON.stringify(sorted, null, 2)}\n`;
// }

// function sortDeep(input: unknown): unknown {
//   if (Array.isArray(input)) {
//     return input.map((value) => sortDeep(value));
//   }
//   if (input && typeof input === 'object') {
//     const objectInput = input as Record<string, unknown>;
//     const keys = Object.keys(objectInput).sort((a, b) => a.localeCompare(b));
//     const output: Record<string, unknown> = {};
//     for (const key of keys) {
//       output[key] = sortDeep(objectInput[key]);
//     }
//     return output;
//   }
//   return input;
// }

// function ensureDir(dirPath: string) {
//   fs.mkdirSync(dirPath, { recursive: true });
// }

// function readJson(filePath: string): unknown {
//   return JSON.parse(fs.readFileSync(filePath, 'utf8'));
// }

// function toPosix(input: string): string {
//   return input.replace(/\\/g, '/');
// }

// main();
