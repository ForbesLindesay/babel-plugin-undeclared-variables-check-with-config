import {transform} from 'babel-core';
import plugin from '../';
import classes from 'babel-plugin-transform-es2015-classes';
import jsx from 'babel-plugin-transform-react-jsx';

test('simple undeclared variable', () => {
  // counter example
  const opts = {
    babelrc: false,
    plugins: [
      plugin,
    ],
  };
  const input = `Promise.resolve(foo).then(console.log);`;
  expect(
    () => transform(input, opts)
  ).toThrow(/Reference to undeclared variable "foo"/);
});
test('jsx undeclared variable', () => {
  // counter example
  const opts = {
    babelrc: false,
    plugins: [
      jsx,
      plugin,
    ],
  };
  const input = `const x = <Foo />`;
  expect(
    () => transform(input, opts)
  ).toThrow(/Reference to undeclared variable "Foo"/);
});

test('Declared variables', () => {
  const opts = {
    babelrc: false,
    plugins: [
      plugin,
    ],
  };
  const input = `
    import Foo from './foo';

    class Bar extends Foo {
      constructor(props) {
        super(props);
      }
    }
  `;
  const {code} = transform(input, opts);
  expect(code).toMatchSnapshot();
});

test('Declared, transformed variables', () => {
  const opts = {
    babelrc: false,
    plugins: [
      classes,
      plugin,
    ],
  };
  const input = `
    import Foo from './foo';

    class Bar extends Foo {
      constructor(props) {
        super(props);
      }
    }
  `;
  const {code} = transform(input, opts);
  expect(code).toMatchSnapshot();
});

test('Declared, transformed variables', () => {
  const opts = {
    babelrc: false,
    plugins: [
      classes,
      plugin,
    ],
  };
  const input = `
    import {Component, Children} from 'react';

    class Provider extends Component {
      getChildContext() {
        return {loginClient: this.client};
      }

      constructor(props, context) {
        super(props, context);
        this.client = props.client;
      }

      render() {
        return Children.only(this.props.children);
      }
    }
  `;
  const {code} = transform(input, opts);
  expect(code).toMatchSnapshot();
});
