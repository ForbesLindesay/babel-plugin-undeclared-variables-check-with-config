import {transform} from 'babel-core';
import plugin from '../';
import classes from 'babel-plugin-transform-es2015-classes';
import jsx from 'babel-plugin-transform-react-jsx';
import pug from 'babel-plugin-transform-react-pug';
import blockScoping from 'babel-plugin-transform-es2015-block-scoping';

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
  const input = `
    import React from 'react';
    const x = <Foo />;
  `;
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

test('declared pug variables', () => {
  const opts = {
    babelrc: false,
    plugins: [
      pug,
      jsx,
      blockScoping,
      plugin,
    ],
  };
  const input = `
  import React from 'react';
  import Col from 'core/col';

  const MyComponent = React.createClass({
    render() {
      const foo = [];

      return pug\`
        div
          each list, col in foo
            div(key=col)
              Col(sm=4)
                each div in list
                  div(key=div.id)
      \`;
    },
  });
  `;
  const {code} = transform(input, opts);
  expect(code).toMatchSnapshot();
});

test('globals comment', () => {
  const opts = {
    babelrc: false,
    plugins: [
      plugin,
    ],
  };
  const input = `
    /* global BlahBlahBlah, BingBingBing */
    console.log(BlahBlahBlah, BingBingBing);
  `;
  const {code} = transform(input, opts);
  expect(code).toMatchSnapshot();
});
