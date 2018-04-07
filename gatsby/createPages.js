const { resolve } = require('path');
const algoliasearch = require('algoliasearch');

const createPages = async ({ boundActionCreators, graphql }) => {
  const { createPage } = boundActionCreators;

  const jargonsTemplate = resolve(__dirname, '../src/templates/jargons.js');
  const jargonTemplate = resolve(__dirname, '../src/templates/jargon.js');
  const tagsTemplate = resolve(__dirname, '../src/templates/tags.js');
  const tagTemplate = resolve(__dirname, '../src/templates/tag.js');

  const allMarkdown = await graphql(`
    {
      allMarkdownRemark(limit: 1000) {
        edges {
          node {
            fields {
              slug
              tagList {
                title
                slug
              }
            }
            frontmatter {
              title
              tags
            }
          }
        }
      }
    }
  `);

  if (allMarkdown.errors) {
    throw Error(allMarkdown.errors);
  }

  // Algolia Indexes
  const algoliaClient = algoliasearch(
    process.env.ALGOLIASEARCH_APP_ID,
    process.env.ALGOLIASEARCH_ADMIN_KEY,
  );

  const jargonsIndex = algoliaClient.initIndex('jargons');
  const tagsIndex = algoliaClient.initIndex('tags');

  const tagList = [];
  const jargonList = [];

  allMarkdown.data.allMarkdownRemark.edges.forEach(({ node }) => {
    const jargon = {
      title: node.frontmatter.title,
      slug: node.fields.slug,
    };

    jargonList.push(jargon);
    jargonsIndex.addObject(jargon, jargon.slug);

    node.fields.tagList.forEach(tag => {
      if (tagList.findIndex(t => t.slug === tag.slug) === -1) {
        tagList.push(tag);
        tagsIndex.addObject(tag, tag.slug);
      }
    });

    // Jargon Detail Page
    createPage({
      path: node.fields.slug,
      component: jargonTemplate,
      context: {
        slug: node.fields.slug,
      },
    });
  });

  // All Jargons Page
  createPage({
    path: '/dizin',
    component: jargonsTemplate,
    context: {
      jargonList,
    },
  });

  // All Tags Page
  createPage({
    path: '/etiketler',
    component: tagsTemplate,
    context: {
      tagList,
    },
  });

  // Tag Detail Page
  tagList.forEach(tag => {
    createPage({
      path: `/e/${tag.slug}`,
      component: tagTemplate,
      context: {
        tag: tag.title,
      },
    });
  });
};

module.exports = createPages;