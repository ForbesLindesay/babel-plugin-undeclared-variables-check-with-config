import globals from 'globals';
import leven from 'leven';

module.exports = function ({messages}) {
  return {
    visitor: {
      ReferencedIdentifier(path) {
        const {node} = path;

        // a bug in babel means you have to walk the entire parent path if you want to ensure you have actually seen
        // all scopes
        let scope = path.scope;
        let pp = path.parentPath;
        while (pp && !scope.hasBinding(node.name)) {
          scope = pp.scope;
          pp = pp.parentPath;
        }
        if (scope.hasBinding(node.name)) return;

        const binding = scope.getBinding(node.name);
        if (binding && binding.kind === "type" && !path.parentPath.isFlow()) {
          throw path.buildCodeFrameError(messages.get("undeclaredVariableType", node.name), ReferenceError);
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

        // get the closest declaration to offer as a suggestion
        // the variable name may have just been mistyped

        const bindings = scope.getAllBindings();

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
