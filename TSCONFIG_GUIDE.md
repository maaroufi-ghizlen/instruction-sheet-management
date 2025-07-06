# 🎯 Flexible TypeScript Configuration for Services

This configuration allows all services to use shared code directly from source files using the `@shared/*` pattern.

## 📋 Benefits

✅ **Direct Source Access** - Import from TypeScript source files, not compiled dist
✅ **Clean Build Output** - Only service files in dist/, no shared code duplication
✅ **Fast Development** - No need to rebuild shared package for changes
✅ **Flexible Imports** - Use specific paths like `@shared/types` or wildcard `@shared/*`
✅ **Project References** - TypeScript project references for proper dependency management

## 🔧 Configuration

### Service tsconfig.json
```jsonc
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      // 🎯 SHARED PACKAGE PATHS - Use source files directly
      "@shared/*": ["../../shared/common/*"],
      "@shared/types": ["../../shared/common/types/index"],
      "@shared/enums": ["../../shared/common/enums/enums"],
      "@shared/interfaces": ["../../shared/common/interfaces/interfaces"],
      "@shared/constants": ["../../shared/common/constants/constants"],
      "@shared/decorators": ["../../shared/common/decorators/index"],
      "@shared/guards": ["../../shared/common/guards/index"],
      "@shared/utils": ["../../shared/common/utils/index"],
      "@shared/auth": ["../../shared/common/auth/index"],
      "@shared/dtos": ["../../shared/common/dtos/index"],
      
      // 📁 LOCAL SERVICE PATHS
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*.spec.ts"],
  "references": [
    {
      "path": "../../shared"
    }
  ]
}
```

### Shared tsconfig.json
```jsonc
{
  "compilerOptions": {
    "composite": true,  // Required for project references
    "declaration": true,
    "outDir": "./dist",
    // ... other options
  }
}
```

## 🚀 Usage Examples

### Specific Imports (Recommended)
```typescript
import { UserRole } from '@shared/enums';
import { JwtPayload } from '@shared/types';
import { Public, CurrentUser } from '@shared/decorators';
import { RolesGuard } from '@shared/guards';
```

### Wildcard Imports
```typescript
import { UserRole } from '@shared/enums/enums';
import { JwtPayload } from '@shared/types/index';
import { Public } from '@shared/decorators/public.decorator';
```

## 🏗️ Build Process

1. **Clean Build**: Removes only service files from dist/
2. **Fast Compilation**: TypeScript resolves shared imports without compilation
3. **No Duplication**: Shared code stays in shared package, not duplicated in services

## 📂 Expected Dist Structure

```
services/auth-service/dist/
├── auth/
│   ├── auth.controller.js
│   ├── auth.service.js
│   └── strategies/
├── config/
├── database/
├── main.js
└── app.module.js
```

**Note**: No shared/ folder in service dist - this is correct!

## 🔄 Migration Guide

1. Copy `tsconfig.service.template.json` to your service
2. Rename to `tsconfig.json`
3. Update imports to use `@shared/*` pattern
4. Ensure shared package has `"composite": true`
5. Add project reference to shared package
6. Build and verify clean dist structure
