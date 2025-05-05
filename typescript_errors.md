## Erros de TypeScript Encontrados

Durante a execução do comando `npm run build`, foram encontrados os seguintes erros de TypeScript:

```
src/routes/companyRoutes.ts:28:78 - error TS2345: Argument of type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' is not assignable to parameter of type 
'RequestHandlerParams<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
'.
  Type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' is not assignable to type 
'RequestHandler<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
'.
    Type 
'Promise<void>
' is not assignable to type 
'any
'.

28 router.post("/", ...companyValidationRules, validateRequest, asyncHandler(createCompany));
                                                                            ~~~~~~~~~~~~~

src/routes/companyRoutes.ts:32:79 - error TS2345: Argument of type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' is not assignable to parameter of type 
'RequestHandlerParams<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
'.

32 router.put("/:id", ...companyValidationRules, validateRequest, asyncHandler(updateCompany));
                                                                             ~~~~~~~~~~~~~

src/routes/companyRoutes.ts:36:81 - error TS2345: Argument of type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' is not assignable to parameter of type 
'RequestHandlerParams<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
'.

36 router.delete("/:id", ...companyIdValidator, validateRequest, asyncHandler(deleteCompany));
                                                                               ~~~~~~~~~~~~~

src/routes/professionalRoutes.ts:30:88 - error TS2345: Argument of type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' is not assignable to parameter of type 
'RequestHandlerParams<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
'.

30 router.post("/", ...professionalValidationRules, validateRequest, asyncHandler(createProfessional));
                                                                                        ~~~~~~~~~~~~~~~~~~

src/routes/professionalRoutes.ts:34:89 - error TS2345: Argument of type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' is not assignable to parameter of type 
'RequestHandlerParams<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
'.

34 router.put("/:id", ...professionalValidationRules, validateRequest, asyncHandler(updateProfessional));
                                                                                         ~~~~~~~~~~~~~~~~~~

src/routes/professionalRoutes.ts:38:91 - error TS2345: Argument of type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' is not assignable to parameter of type 
'RequestHandlerParams<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
'.

38 router.delete("/:id", ...professionalIdValidator, validateRequest, asyncHandler(deleteProfessional));
                                                                                           ~~~~~~~~~~~~~~~~~~

src/routes/serviceRoutes.ts:25:78 - error TS2345: Argument of type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' is not assignable to parameter of type 
'RequestHandlerParams<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
'.
  Type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' provides no match for the signature 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction): Promise<...>
'.

25 router.post("/", ...serviceValidationRules, validateRequest, asyncHandler(createService));
                                                                            ~~~~~~~~~~~~~

src/routes/serviceRoutes.ts:27:79 - error TS2345: Argument of type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' is not assignable to parameter of type 
'RequestHandlerParams<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
'.
  Type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' provides no match for the signature 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction): Promise<...>
'.

27 router.put("/:id", ...serviceValidationRules, validateRequest, asyncHandler(updateService));
                                                                             ~~~~~~~~~~~~~

src/routes/serviceRoutes.ts:29:81 - error TS2345: Argument of type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' is not assignable to parameter of type 
'RequestHandlerParams<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
'.
  Type 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>
' provides no match for the signature 
'(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction): Promise<...>
'.

29 router.delete("/:id", ...serviceIdValidator, validateRequest, asyncHandler(deleteService));
                                                                              ~~~~~~~~~~~~~

src/tests/activityFeedRoutes.integration.test.ts:2:21 - error TS2307: Cannot find module '../src/app' or its corresponding type declarations.

2 import { app } from "../src/app"; // Corrected import path
                      ~~~~~~~~~~~~

src/tests/appointmentHelpers.unit.test.ts:2:5 - error TS2459: Module '"../controllers/appointmentController"' declares 'parseDuration' locally, but it is not exported.

2     parseDuration,
      ~~~~~~~~~~~~~

  src/controllers/appointmentController.ts:57:7
    57 const parseDuration = (durationString: string | null): number | null => {
             ~~~~~~~~~~~~~
    'parseDuration' is declared here.

src/tests/appointmentHelpers.unit.test.ts:3:5 - error TS2459: Module '"../controllers/appointmentController"' declares 'getWorkingHoursForDay' locally, but it is not exported.

3     getWorkingHoursForDay,
      ~~~~~~~~~~~~~~~~~~~~~

  src/controllers/appointmentController.ts:76:7
    76 const getWorkingHoursForDay = (workingHoursJson: Prisma.JsonValue | null | undefined, date: Date): { start: Date, end: Date } | null => {
             ~~~~~~~~~~~~~~~~~~~~~
    'getWorkingHoursForDay' is declared here.

src/tests/appointmentRoutes.integration.test.ts:2:21 - error TS2307: Cannot find module '../src/app' or its corresponding type declarations.

2 import { app } from "../src/app"; // Corrected path to app
                      ~~~~~~~~~~~~

src/tests/appointmentRoutes.integration.test.ts:6:31 - error TS2307: Cannot find module '../src/utils/jwt' or its corresponding type declarations.

6 import { generateToken } from "../src/utils/jwt"; // Corrected path to jwt utils
                                ~~~~~~~~~~~~~~~~~~

src/tests/appointmentRoutes.integration.test.ts:113:13 - error TS2353: Object literal may only specify known properties, and 'userId' does not exist in type '(Without<ProfessionalCreateInput, ProfessionalUncheckedCreateInput> & ProfessionalUncheckedCreateInput) | (Without<...> & ProfessionalCreateInput)'.

113             userId: testProfessionalUser.id,
                ~~~~~~

  node_modules/.prisma/client/index.d.ts:9816:5
    9816     data: XOR<ProfessionalCreateInput, ProfessionalUncheckedCreateInput>
             ~~~~
    The expected type comes from property 'data' which is declared here on type '{ select?: ProfessionalSelect<DefaultArgs> | null | undefined; omit?: ProfessionalOmit<DefaultArgs> | null | undefined; include?: ProfessionalInclude<...> | ... 1 more ... | undefined; data: (Without<...> & ProfessionalUncheckedCreateInput) | (Without<...> & ProfessionalCreateInput); }'

src/tests/gamificationRoutes.integration.test.ts:85:13 - error TS2353: Object literal may only specify known properties, and 'user' does not exist in type 'Without<ProfessionalCreateInput, ProfessionalUncheckedCreateInput> & ProfessionalUncheckedCreateInput'.

85             user: { connect: { id: testProfUserId } }, // Link to the created user
               ~~~~

  node_modules/.prisma/client/index.d.ts:9816:5
    9816     data: XOR<ProfessionalCreateInput, ProfessionalUncheckedCreateInput>
             ~~~~
    The expected type comes from property 'data' which is declared here on type '{ select?: ProfessionalSelect<DefaultArgs> | null | undefined; omit?: ProfessionalOmit<DefaultArgs> | null | undefined; include?: ProfessionalInclude<...> | ... 1 more ... | undefined; data: (Without<...> & ProfessionalUncheckedCreateInput) | (Without<...> & ProfessionalCreateInput); }'

Found 16 errors in 7 files.
Errors  Files
     3  src/routes/companyRoutes.ts:28
     3  src/routes/professionalRoutes.ts:30
     3  src/routes/serviceRoutes.ts:25
     1  src/tests/activityFeedRoutes.integration.test.ts:2
     2  src/tests/appointmentHelpers.unit.test.ts:2
     3  src/tests/appointmentRoutes.integration.test.ts:2
     1  src/tests/gamificationRoutes.integration.test.ts:85
```

Os erros parecem estar concentrados principalmente em:
- Tipagem incorreta de argumentos para `asyncHandler` nas rotas (TS2345).
- Módulos não encontrados ou tipos não declarados em arquivos de teste (TS2307).
- Funções declaradas localmente mas não exportadas, impedindo o uso em testes (TS2459).
- Propriedades desconhecidas em literais de objeto, provavelmente relacionados a tipos gerados pelo Prisma (TS2353).

Vou prosseguir tentando executar `npm run dev`, mas é provável que esses erros impeçam o funcionamento correto ou causem problemas em tempo de execução.

