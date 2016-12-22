import globals from 'globals';
import leven from 'leven';

module.exports = function ({messages}) {
  return {
    pre(file) {
      this.commmentGlobals = [];
      file.ast.comments.forEach(({value}) => {
        const v = value.trim();
        if (/^global /.test(v)) {
          v.replace(/^global /, '').split(',').forEach(name => {
            this.commmentGlobals.push(name.trim());
          });
        }
      });
    },
    visitor: {
      ReferencedIdentifier(path) {
        const {node} = path;

        // a bug in babel means you have to walk the entire parent path if you want to ensure you have actually seen
        // all scopes
        let pp = path;
        while (pp) {
          const scope = pp.scope;

          const binding = scope.getBinding(node.name);
          if (binding && binding.kind === "type" && !path.parentPath.isFlow()) {
            throw path.buildCodeFrameError(messages.get("undeclaredVariableType", node.name), ReferenceError);
          }

          if (scope.hasBinding(node.name)) {
            return;
          }

          // babel sometimes struggles to notice that variables declared in the `init` portion of loops are available
          // throughout the loop
          if (pp.node.type === 'ForStatement' && pp.node.init.type === 'VariableDeclaration') {
            const name = JSON.stringify(node.name);
            if (
              pp.node.init.declarations.some(({id}) => {
                if (id.type === 'Identifier') {
                  return id.name === node.name;
                }
                return JSON.stringify(id).indexOf(name) !== -1;
              })
            ) {
              return;
            }
          }

          pp = pp.parentPath;
        }

        const opts = this.opts;
        if (
          opts && Array.isArray(opts.globals) &&
          opts.globals.indexOf(node.name) !== -1
        ) {
          return;
        }
        const builtins = (
          opts && Array.isArray(opts.builtins)
          ? opts.builtins
          : ['builtin', 'browser', 'worker', 'node', 'jest', 'jquery', 'serviceworker', 'webextensions']
        );
        if (
          builtins.some(b => typeof globals[b][node.name] === 'boolean')
        ) {
          return;
        }
        if (this.commmentGlobals.indexOf(node.name) !== -1) {
          return;
        }

        // get the closest declaration to offer as a suggestion
        // the variable name may have just been mistyped

        const bindings = path.scope.getAllBindings();

        let closest;
        let shortest = -1;

        for (const name in bindings) {
          const distance = leven(node.name, name);
          if (distance <= 0 || distance > 3) continue;
          if (distance >= node.name.length) continue;
          if (distance >= name.length) continue;
          if (distance <= shortest) continue;

          closest = name;
          shortest = distance;
        }

        let msg;
        if (closest) {
          msg = messages.get("undeclaredVariableSuggestion", node.name, closest);
        } else {
          msg = messages.get("undeclaredVariable", node.name);
        }

        throw path.buildCodeFrameError(msg, ReferenceError);
      },
    },
  };
};
