import { Contributor, Page, PageContent, Space } from 'models';

export const spaces: Space[] = [
  { id: '0', name: 'Our Community', domain: 'demo' },
  { id: '1', name: 'My Workspace', domain: 'my-workspace' }
];

export const contributors: Contributor[] = [
  { id: '0', address: '0x87ddfh6g435D12CE393aBbA3f81fe6C594543sdw', favorites: [], username: 'dolemite', spaceRoles: [{ spaceId: spaces[0].id, type: 'admin', userId: '0' }, { spaceId: spaces[1].id, type: 'admin', userId: '0' }] },
  { id: '1', address: '0x1416d1b5435D12CE393aBbA3f81fe6C5951e4Bf4', favorites: [], username: 'cerberus', spaceRoles: [{ spaceId: spaces[0].id, type: 'admin', userId: '1' }] },
  { id: '2', address: '0x626a827c90AA620CFD78A8ecda494Edb9a4225D5', favorites: [], username: 'devorein', spaceRoles: [{ spaceId: spaces[0].id, type: 'contributor', userId: '2' }, { spaceId: spaces[1].id, type: 'admin', userId: '2' }] },
  { id: '3', address: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2', favorites: [], username: 'mattopoly', spaceRoles: [{ spaceId: spaces[1].id, type: 'contributor', userId: '3' }] }
];

export const activeUser = contributors[0];

function MockPage (partial: Partial<Page>): Page {
  const id = Math.random().toString(36).substring(2);
  return {
    created: new Date(),
    id,
    type: 'page',
    title: '',
    content: {
      type: 'doc',
      content: []
    } as PageContent,
    isPublic: false,
    parentId: null,
    path: id,
    spaceId: '',
    ...partial
  };
}

export const pages: Page[] = [
  MockPage({
    id: '0',
    icon: '📌',
    content: gettingStartedPageContent(),
    path: 'getting-started',
    spaceId: '0',
    title: 'Getting Started'
  }),
  MockPage({
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello World'
            }
          ]
        }
      ]
    },
    parentId: '0',
    path: 'nested-page',
    spaceId: '0',
    title: 'Nested Page'
  }),
  MockPage({
    path: 'third-page',
    spaceId: '0',
    title: 'Another Top-level Page'
  }),
  MockPage({
    path: 'database-page',
    spaceId: '0',
    title: 'Database page',
    type: 'database'
  }),
  MockPage({
    icon: '📌',
    content: getPageContent(),
    path: 'fifth-page',
    spaceId: '1',
    title: 'Getting Started Again'
  })
];

function gettingStartedPageContent (): PageContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '👋 Welcome to your workspace!'
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 3,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Some basics to get you started'
          }
        ]
      },
      {
        type: 'bulletList',
        attrs: {
          tight: false
        },
        content: [
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Click anywhere and just start typing'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Use '
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ],
                    text: '/'
                  },
                  {
                    type: 'text',
                    text: ' to see the different styles and content you can create - bold, italics, tables, task lists, images, videos, etc'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Use '
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ],
                    text: ':'
                  },
                  {
                    type: 'text',
                    text: ' for inserting emojis. Use '
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ],
                    text: '@'
                  },
                  {
                    type: 'text',
                    text: ' for mentioning people'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Use '
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ],
                    text: '+'
                  },
                  {
                    type: 'text',
                    text: ' button in the sidebar to add new pages'
                  }
                ]
              }
            ]
          }

        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 3,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'See how it works'
          }
        ]
      },
      {
        type: 'blockquote',
        attrs: {
          emoji: '👉🏼'
        },
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  }
                ],
                text: 'Questions?'
              },
              {
                type: 'text',
                text: ' Email us at '
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'code'
                  }
                ],
                text: 'hello@charmverse.io'
              },
              {
                type: 'text',
                text: 'or join our community in '
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href: 'https://discord.gg/n8VU9pAm'
                    }
                  }
                ],
                text: 'Discord'
              }
            ]
          }
        ]
      }
    ]
  };
}

function getPageContent (): PageContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'H2 Heading'
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 3,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'H3 Heading'
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Marks'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [
              {
                type: 'italic'
              }
            ],
            text: 'italic'
          },
          {
            type: 'text',
            text: ', '
          },
          {
            type: 'text',
            marks: [
              {
                type: 'bold'
              }
            ],
            text: 'Bold'
          },
          {
            type: 'text',
            text: ', '
          },
          {
            type: 'text',
            marks: [
              {
                type: 'italic'
              }
            ],
            text: 'underlined'
          },
          {
            type: 'text',
            text: ', '
          },
          {
            type: 'text',
            marks: [
              {
                type: 'strike'
              }
            ],
            text: 'striked'
          },
          {
            type: 'text',
            text: ', '
          },
          {
            type: 'text',
            marks: [
              {
                type: 'code'
              }
            ],
            text: 'code'
          },
          {
            type: 'text',
            text: ', '
          },
          {
            type: 'text',
            marks: [
              {
                type: 'link',
                attrs: {
                  href: 'https://en.wikipedia.org/wiki/Main_Page'
                }
              }
            ],
            text: 'link'
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Simple Table'
          }
        ]
      },
      {
        type: 'table',
        content: [
          {
            type: 'table_row',
            content: [
              {
                type: 'table_header',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'col1'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_header',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'col2'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_header',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'col3'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: 'table_row',
            content: [
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 1 col 1'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 1 col 2'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 1 col 3'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: 'table_row',
            content: [
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 2 col 1'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 2 col 2'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 2 col 3'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'GFM Todo Lists'
          }
        ]
      },
      {
        type: 'bulletList',
        attrs: {
          tight: false
        },
        content: [
          {
            type: 'listItem',
            attrs: {
              todoChecked: true
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Check out BangleJS'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Walk the cat'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Drag these lists by dragging the square up or down.'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Move these lists with shortcut '
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ],
                    text: 'Option-ArrowUp'
                  },
                  {
                    type: 'text',
                    text: '. You can move any node (yes headings too) with this shortcut.'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Unordered Lists'
          }
        ]
      },
      {
        type: 'bulletList',
        attrs: {
          tight: false
        },
        content: [
          {
            type: 'listItem',
            attrs: {
              todoChecked: null
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'This is an ordered list'
                  }
                ]
              },
              {
                type: 'bulletList',
                attrs: {
                  tight: false
                },
                content: [
                  {
                    type: 'listItem',
                    attrs: {
                      todoChecked: null
                    },
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'I am a nested ordered list'
                          }
                        ]
                      }
                    ]
                  },
                  {
                    type: 'listItem',
                    attrs: {
                      todoChecked: null
                    },
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'I am another nested one'
                          }
                        ]
                      },
                      {
                        type: 'bulletList',
                        attrs: {
                          tight: true
                        },
                        content: [
                          {
                            type: 'listItem',
                            attrs: {
                              todoChecked: null
                            },
                            content: [
                              {
                                type: 'paragraph',
                                content: [
                                  {
                                    type: 'text',
                                    text: 'Bunch of nesting right?'
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Ordered Lists'
          }
        ]
      },
      {
        type: 'orderedList',
        attrs: {
          order: 1,
          tight: false
        },
        content: [
          {
            type: 'listItem',
            attrs: {
              todoChecked: null
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Bringing order to the world.'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: null
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Nobody remembers who came second.'
                  }
                ]
              },
              {
                type: 'orderedList',
                attrs: {
                  order: 1,
                  tight: false
                },
                content: [
                  {
                    type: 'listItem',
                    attrs: {
                      todoChecked: null
                    },
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'We can cheat to become first by nesting.'
                          }
                        ]
                      },
                      {
                        type: 'bulletList',
                        attrs: {
                          tight: true
                        },
                        content: [
                          {
                            type: 'listItem',
                            attrs: {
                              todoChecked: null
                            },
                            content: [
                              {
                                type: 'paragraph',
                                content: [
                                  {
                                    type: 'text',
                                    text: 'Oh an you can mix and match ordered unordered.'
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Image'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'You can also directly paste images.\n'
          },
          {
            type: 'image',
            attrs: {
              src: 'https://user-images.githubusercontent.com/6966254/101979122-f4405e80-3c0e-11eb-9bf8-9af9b1ddc94f.png',
              alt: null,
              title: null
            }
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Blockquote'
          }
        ]
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'I am a blockquote, trigger me by typing > on a new line'
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Code Block'
          }
        ]
      },
      {
        type: 'codeBlock',
        attrs: {
          language: ''
        },
        content: [
          {
            type: 'text',
            text: "// This is a code block\nfunction foo() {\n  console.log('Hello world!')\n}"
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Paragraph'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'I am a boring paragraph'
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Horizontal Break'
          }
        ]
      },
      {
        type: 'horizontalRule'
      }
    ]
  };
}

export const blocks = JSON.parse('[{"id":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","schema":1,"workspaceId":"0","parentId":"","rootId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","createdBy":"system","modifiedBy":"system","type":"board","fields":{"showDescription":false,"description":"","icon":"🎯","isTemplate":true,"columnCalculations":[],"cardProperties":[{"id":"a972dc7a-5f4c-45d2-8044-8c28c69717f1","name":"Status","type":"select","options":[{"color":"propColorDefault","id":"447ecf41-df5d-42e1-89ab-714e675ea671","value":"Next Up"},{"color":"propColorYellow","id":"dd7b3a79-eb2d-4935-8959-29059ad9573a","value":"In Progress"},{"color":"propColorGreen","id":"dd7ab2bd-9c76-4de9-80f8-517e16fd1851","value":"Completed  🙌"},{"color":"propColorBrown","id":"65e5c9a3-3baa-4f17-816c-2ab2ba73ded9","value":"Archived"}]},{"id":"d3d682bf-e074-49d9-8df5-7320921c2d23","name":"Priority","type":"select","options":[{"color":"propColorRed","id":"d3bfb50f-f569-4bad-8a3a-dd15c3f60101","value":"High 🔥"},{"color":"propColorYellow","id":"87f59784-b859-4c24-8ebe-17c766e081dd","value":"Medium"},{"color":"propColorGray","id":"98a57627-0f76-471d-850d-91f3ed9fd213","value":"Low"}]},{"id":"2a5da320-735c-4093-8787-f56e15cdfeed","name":"Date Created","type":"createdTime","options":[]}]},"title":"Project Tasks","createAt":1643732964942,"updateAt":1643732964942,"deleteAt":0},{"id":"3fa520eb-30cd-4852-829a-ba3bc7e88e26","schema":1,"workspaceId":"0","parentId":"","rootId":"3fa520eb-30cd-4852-829a-ba3bc7e88e26","createdBy":"system","modifiedBy":"system","type":"board","fields":{"showDescription":false,"description":"","icon":"🗒️","isTemplate":true,"columnCalculations":[],"cardProperties":[{"id":"7c212e78-9345-4c60-81b5-0b0e37ce463f","name":"Type","type":"select","options":[{"color":"propColorYellow","id":"31da50ca-f1a9-4d21-8636-17dc387c1a23","value":"Ad Hoc"},{"color":"propColorBlue","id":"def6317c-ec11-410d-8a6b-ea461320f392","value":"Standup"},{"color":"propColorPurple","id":"700f83f8-6a41-46cd-87e2-53e0d0b12cc7","value":"Weekly Sync"}]},{"id":"13d2394a-eb5e-4f22-8c22-6515ec41c4a4","name":"Summary","type":"text","options":[]}]},"title":"Meeting Notes","createAt":1643732964943,"updateAt":1643732964943,"deleteAt":0},{"id":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","schema":1,"workspaceId":"0","parentId":"","rootId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","createdBy":"system","modifiedBy":"system","type":"board","fields":{"showDescription":false,"description":"","icon":"⛰️","isTemplate":true,"columnCalculations":[],"cardProperties":[{"id":"af6fcbb8-ca56-4b73-83eb-37437b9a667d","name":"Status","type":"select","options":[{"color":"propColorRed","id":"bf52bfe6-ac4c-4948-821f-83eaa1c7b04a","value":"To Do"},{"color":"propColorYellow","id":"77c539af-309c-4db1-8329-d20ef7e9eacd","value":"Doing"},{"color":"propColorGreen","id":"98bdea27-0cce-4cde-8dc6-212add36e63a","value":"Done 🙌"}]},{"id":"d9725d14-d5a8-48e5-8de1-6f8c004a9680","name":"Category","type":"select","options":[{"color":"propColorPurple","id":"3245a32d-f688-463b-87f4-8e7142c1b397","value":"Life Skills"},{"color":"propColorGreen","id":"80be816c-fc7a-4928-8489-8b02180f4954","value":"Finance"},{"color":"propColorOrange","id":"ffb3f951-b47f-413b-8f1d-238666728008","value":"Health"}]},{"id":"d6b1249b-bc18-45fc-889e-bec48fce80ef","name":"Due Date","type":"select","options":[{"color":"propColorDefault","id":"9a090e33-b110-4268-8909-132c5002c90e","value":"Q1"},{"color":"propColorDefault","id":"0a82977f-52bf-457b-841b-e2b7f76fb525","value":"Q2"},{"color":"propColorDefault","id":"6e7139e4-5358-46bb-8c01-7b029a57b80a","value":"Q3"},{"color":"propColorDefault","id":"d5371c63-66bf-4468-8738-c4dc4bea4843","value":"Q4"}]}]},"title":"Personal Goals","createAt":1643732964944,"updateAt":1643732964944,"deleteAt":0},{"id":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","schema":1,"workspaceId":"0","parentId":"","rootId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","createdBy":"system","modifiedBy":"system","type":"board","fields":{"showDescription":false,"description":"","icon":"✔️","isTemplate":true,"columnCalculations":[],"cardProperties":[{"id":"d777ba3b-8728-40d1-87a6-59406bbbbfb0","name":"Status","type":"select","options":[{"color":"propColorPink","id":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7","value":"To Do"},{"color":"propColorYellow","id":"d37a61f4-f332-4db9-8b2d-5e0a91aa20ed","value":"Doing"},{"color":"propColorGreen","id":"dabadd9b-adf1-4d9f-8702-805ac6cef602","value":"Done 🙌"}]}]},"title":"Personal Tasks","createAt":1643732964945,"updateAt":1643732964945,"deleteAt":0},{"id":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","schema":1,"workspaceId":"0","parentId":"","rootId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","createdBy":"system","modifiedBy":"system","type":"board","fields":{"showDescription":false,"description":"","icon":"🗺️","isTemplate":true,"columnCalculations":[],"cardProperties":[{"id":"50117d52-bcc7-4750-82aa-831a351c44a0","name":"Status","type":"select","options":[{"color":"propColorDefault","id":"8c557f69-b0ed-46ec-83a3-8efab9d47ef5","value":"Not Started"},{"color":"propColorYellow","id":"ec6d2bc5-df2b-4f77-8479-e59ceb039946","value":"In Progress"},{"color":"propColorGreen","id":"849766ba-56a5-48d1-886f-21672f415395","value":"Complete 🙌"}]},{"id":"20717ad3-5741-4416-83f1-6f133fff3d11","name":"Type","type":"select","options":[{"color":"propColorYellow","id":"424ea5e3-9aa1-4075-8c5c-01b44b66e634","value":"Epic ⛰"},{"color":"propColorGreen","id":"6eea96c9-4c61-4968-8554-4b7537e8f748","value":"Task 🔨"},{"color":"propColorRed","id":"1fdbb515-edd2-4af5-80fc-437ed2211a49","value":"Bug 🐞"}]},{"id":"60985f46-3e41-486e-8213-2b987440ea1c","name":"Sprint","type":"select","options":[{"color":"propColorDefault","id":"c01676ca-babf-4534-8be5-cce2287daa6c","value":"Sprint 1"},{"color":"propColorDefault","id":"ed4a5340-460d-461b-8838-2c56e8ee59fe","value":"Sprint 2"},{"color":"propColorDefault","id":"14892380-1a32-42dd-8034-a0cea32bc7e6","value":"Sprint 3"}]},{"id":"f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","name":"Priority","type":"select","options":[{"color":"propColorRed","id":"cb8ecdac-38be-4d36-8712-c4d58cc8a8e9","value":"P1 🔥"},{"color":"propColorYellow","id":"e6a7f297-4440-4783-8ab3-3af5ba62ca11","value":"P2"},{"color":"propColorGray","id":"c62172ea-5da7-4dec-8186-37267d8ee9a7","value":"P3"}]}]},"title":"Roadmap","createAt":1643732964946,"updateAt":1643732964946,"deleteAt":0},{"id":"007cac66-4ab5-4b50-85b2-209d9e55ac0c","schema":1,"workspaceId":"0","parentId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","rootId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🎛️","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"dd7b3a79-eb2d-4935-8959-29059ad9573a","d3d682bf-e074-49d9-8df5-7320921c2d23":"87f59784-b859-4c24-8ebe-17c766e081dd"},"contentOrder":[],"isTemplate":false},"title":"Settings UX","createAt":1643732964947,"updateAt":1643732964947,"deleteAt":0},{"id":"1c356f9e-f28a-4b1e-86f5-7f4e9d4a7134","schema":1,"workspaceId":"0","parentId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","rootId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"447ecf41-df5d-42e1-89ab-714e675ea671","d3d682bf-e074-49d9-8df5-7320921c2d23":"87f59784-b859-4c24-8ebe-17c766e081dd"},"contentOrder":[],"isTemplate":true},"title":"Task","createAt":1643732964947,"updateAt":1643732964947,"deleteAt":0},{"id":"1cd434b0-75a6-473d-823e-958ac98af66d","schema":1,"workspaceId":"0","parentId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","rootId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"board","groupById":"d3d682bf-e074-49d9-8df5-7320921c2d23","sortOptions":[],"visiblePropertyIds":["d3d682bf-e074-49d9-8df5-7320921c2d23"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By Priority","createAt":1643732964948,"updateAt":1643732964948,"deleteAt":0},{"id":"6f35d3b3-0bd7-4a0b-8c04-458092c36f83","schema":1,"workspaceId":"0","parentId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","rootId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"💽","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"447ecf41-df5d-42e1-89ab-714e675ea671","d3d682bf-e074-49d9-8df5-7320921c2d23":"d3bfb50f-f569-4bad-8a3a-dd15c3f60101"},"contentOrder":[],"isTemplate":false},"title":"Database Schema","createAt":1643732964949,"updateAt":1643732964949,"deleteAt":0},{"id":"b9d1fc1e-8011-40f6-81cb-a60b0139cb8d","schema":1,"workspaceId":"0","parentId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","rootId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"table","sortOptions":[],"visiblePropertyIds":["a972dc7a-5f4c-45d2-8044-8c28c69717f1","d3d682bf-e074-49d9-8df5-7320921c2d23","2a5da320-735c-4093-8787-f56e15cdfeed"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{"2a5da320-735c-4093-8787-f56e15cdfeed":179,"__title":280,"a972dc7a-5f4c-45d2-8044-8c28c69717f1":122,"d3d682bf-e074-49d9-8df5-7320921c2d23":110},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"All Tasks","createAt":1643732964949,"updateAt":1643732964949,"deleteAt":0},{"id":"c0cdec18-2893-49e9-84ec-525db0a54d3b","schema":1,"workspaceId":"0","parentId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","rootId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"board","groupById":"a972dc7a-5f4c-45d2-8044-8c28c69717f1","sortOptions":[],"visiblePropertyIds":[],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By Status","createAt":1643732964950,"updateAt":1643732964950,"deleteAt":0},{"id":"f6a9d1eb-636e-4fc5-8317-c82a97381675","schema":1,"workspaceId":"0","parentId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","rootId":"2bb7dc3d-c36a-4e00-8e0f-a6d31ac053c7","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🌴","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"447ecf41-df5d-42e1-89ab-714e675ea671","d3d682bf-e074-49d9-8df5-7320921c2d23":"87f59784-b859-4c24-8ebe-17c766e081dd"},"contentOrder":[],"isTemplate":false},"title":"API Layer","createAt":1643732964951,"updateAt":1643732964951,"deleteAt":0},{"id":"80119267-bbd7-44c7-8322-224e0cf2e768","schema":1,"workspaceId":"0","parentId":"3fa520eb-30cd-4852-829a-ba3bc7e88e26","rootId":"3fa520eb-30cd-4852-829a-ba3bc7e88e26","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🎻","properties":{"13d2394a-eb5e-4f22-8c22-6515ec41c4a4":"Green light!","7c212e78-9345-4c60-81b5-0b0e37ce463f":"def6317c-ec11-410d-8a6b-ea461320f392"},"contentOrder":["7e0ada05-4b81-4dda-80d6-f5505fec8d6b"],"isTemplate":false},"title":"Nov 2","createAt":1643732964952,"updateAt":1643732964952,"deleteAt":0},{"id":"b810c199-ea69-4608-8b03-20aeb928f1b0","schema":1,"workspaceId":"0","parentId":"3fa520eb-30cd-4852-829a-ba3bc7e88e26","rootId":"3fa520eb-30cd-4852-829a-ba3bc7e88e26","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"board","groupById":"7c212e78-9345-4c60-81b5-0b0e37ce463f","sortOptions":[],"visiblePropertyIds":["13d2394a-eb5e-4f22-8c22-6515ec41c4a4"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By type","createAt":1643732964952,"updateAt":1643732964952,"deleteAt":0},{"id":"d81527f6-693f-44ad-8f9f-f72902046496","schema":1,"workspaceId":"0","parentId":"3fa520eb-30cd-4852-829a-ba3bc7e88e26","rootId":"3fa520eb-30cd-4852-829a-ba3bc7e88e26","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"table","sortOptions":[],"visiblePropertyIds":["7c212e78-9345-4c60-81b5-0b0e37ce463f","13d2394a-eb5e-4f22-8c22-6515ec41c4a4"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{"13d2394a-eb5e-4f22-8c22-6515ec41c4a4":622,"7c212e78-9345-4c60-81b5-0b0e37ce463f":135,"__title":280},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Table view","createAt":1643732964954,"updateAt":1643732964954,"deleteAt":0},{"id":"2010b448-c292-42eb-8ab7-cd6561cbc0b4","schema":1,"workspaceId":"0","parentId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","rootId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"✍️","properties":{"af6fcbb8-ca56-4b73-83eb-37437b9a667d":"bf52bfe6-ac4c-4948-821f-83eaa1c7b04a","d6b1249b-bc18-45fc-889e-bec48fce80ef":"0a82977f-52bf-457b-841b-e2b7f76fb525","d9725d14-d5a8-48e5-8de1-6f8c004a9680":"3245a32d-f688-463b-87f4-8e7142c1b397"},"contentOrder":[],"isTemplate":false},"title":"Start a daily journal","createAt":1643732964955,"updateAt":1643732964955,"deleteAt":0},{"id":"26cca8ac-cb48-4a37-8854-84bae9b19848","schema":1,"workspaceId":"0","parentId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","rootId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"board","groupById":"af6fcbb8-ca56-4b73-83eb-37437b9a667d","sortOptions":[],"visiblePropertyIds":["d9725d14-d5a8-48e5-8de1-6f8c004a9680","d6b1249b-bc18-45fc-889e-bec48fce80ef"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By status","createAt":1643732964956,"updateAt":1643732964956,"deleteAt":0},{"id":"38f4be07-f1fa-494c-8c15-a907006f9a55","schema":1,"workspaceId":"0","parentId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","rootId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🎨","properties":{"af6fcbb8-ca56-4b73-83eb-37437b9a667d":"77c539af-309c-4db1-8329-d20ef7e9eacd","d6b1249b-bc18-45fc-889e-bec48fce80ef":"9a090e33-b110-4268-8909-132c5002c90e","d9725d14-d5a8-48e5-8de1-6f8c004a9680":"3245a32d-f688-463b-87f4-8e7142c1b397"},"contentOrder":[],"isTemplate":false},"title":"Learn to paint","createAt":1643732964956,"updateAt":1643732964956,"deleteAt":0},{"id":"5013c8a7-88e4-490f-8932-119490a110d4","schema":1,"workspaceId":"0","parentId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","rootId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🏦","properties":{"af6fcbb8-ca56-4b73-83eb-37437b9a667d":"bf52bfe6-ac4c-4948-821f-83eaa1c7b04a","d6b1249b-bc18-45fc-889e-bec48fce80ef":"0a82977f-52bf-457b-841b-e2b7f76fb525","d9725d14-d5a8-48e5-8de1-6f8c004a9680":"80be816c-fc7a-4928-8489-8b02180f4954"},"contentOrder":[],"isTemplate":false},"title":"Open retirement account","createAt":1643732964957,"updateAt":1643732964957,"deleteAt":0},{"id":"5885188e-e772-460f-87a2-86308cfc47c0","schema":1,"workspaceId":"0","parentId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","rootId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🏃","properties":{"af6fcbb8-ca56-4b73-83eb-37437b9a667d":"bf52bfe6-ac4c-4948-821f-83eaa1c7b04a","d6b1249b-bc18-45fc-889e-bec48fce80ef":"6e7139e4-5358-46bb-8c01-7b029a57b80a","d9725d14-d5a8-48e5-8de1-6f8c004a9680":"ffb3f951-b47f-413b-8f1d-238666728008"},"contentOrder":[],"isTemplate":false},"title":"Run 3 times a week","createAt":1643732964958,"updateAt":1643732964958,"deleteAt":0},{"id":"ab563eab-b407-434a-8718-18dc887e002f","schema":1,"workspaceId":"0","parentId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","rootId":"6be39cc1-f25c-47bf-8d49-f6e4a80cf872","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"board","groupById":"d6b1249b-bc18-45fc-889e-bec48fce80ef","sortOptions":[],"visiblePropertyIds":["d9725d14-d5a8-48e5-8de1-6f8c004a9680"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By due date","createAt":1643732964959,"updateAt":1643732964959,"deleteAt":0},{"id":"07ba5a30-3e96-4eed-8daf-854cb0aa7307","schema":1,"workspaceId":"0","parentId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","rootId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"board","sortOptions":[],"visiblePropertyIds":[],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Board View","createAt":1643732964960,"updateAt":1643732964960,"deleteAt":0},{"id":"0ee95f39-ce2c-4d68-8181-1cb0d2efa61f","schema":1,"workspaceId":"0","parentId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","rootId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🌳","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7"},"contentOrder":[],"isTemplate":false},"title":"Gardening","createAt":1643732964960,"updateAt":1643732964960,"deleteAt":0},{"id":"523412c1-353a-42fb-818f-adb6b2e5bc7d","schema":1,"workspaceId":"0","parentId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","rootId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7"},"contentOrder":[],"isTemplate":true},"title":"New Task","createAt":1643732964961,"updateAt":1643732964961,"deleteAt":0},{"id":"7d014689-ef9f-4cf7-868d-be527e6f36d6","schema":1,"workspaceId":"0","parentId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","rootId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🐱","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7"},"contentOrder":[],"isTemplate":false},"title":"Feed Fluffy","createAt":1643732964962,"updateAt":1643732964962,"deleteAt":0},{"id":"974560b9-cf5f-440c-87f0-25615b71321e","schema":1,"workspaceId":"0","parentId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","rootId":"934f92b7-9fd1-4b93-8fc1-044abdaeccc9","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"👣","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7"},"contentOrder":[],"isTemplate":false},"title":"Go for a walk","createAt":1643732964962,"updateAt":1643732964962,"deleteAt":0},{"id":"499f58ec-b412-4c84-8cf4-97a2668978ad","schema":1,"workspaceId":"0","parentId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","rootId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"table","sortOptions":[{"propertyId":"f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","reversed":false}],"visiblePropertyIds":["50117d52-bcc7-4750-82aa-831a351c44a0","20717ad3-5741-4416-83f1-6f133fff3d11","60985f46-3e41-486e-8213-2b987440ea1c","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[{"propertyId":"20717ad3-5741-4416-83f1-6f133fff3d11","condition":"includes","values":["1fdbb515-edd2-4af5-80fc-437ed2211a49"]}]},"cardOrder":[],"columnWidths":{"__title":280},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Bugs 🐞","createAt":1643732964963,"updateAt":1643732964963,"deleteAt":0},{"id":"5e6f15b1-22b8-4ef5-822a-ad223d21c200","schema":1,"workspaceId":"0","parentId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","rootId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🛣️","properties":{"20717ad3-5741-4416-83f1-6f133fff3d11":"424ea5e3-9aa1-4075-8c5c-01b44b66e634","50117d52-bcc7-4750-82aa-831a351c44a0":"8c557f69-b0ed-46ec-83a3-8efab9d47ef5","60985f46-3e41-486e-8213-2b987440ea1c":"14892380-1a32-42dd-8034-a0cea32bc7e6","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e":"e6a7f297-4440-4783-8ab3-3af5ba62ca11"},"contentOrder":[],"isTemplate":false},"title":"Review API design","createAt":1643732964964,"updateAt":1643732964964,"deleteAt":0},{"id":"789b834b-4125-45c1-8daf-d36b69ce2825","schema":1,"workspaceId":"0","parentId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","rootId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"board","groupById":"60985f46-3e41-486e-8213-2b987440ea1c","sortOptions":[{"propertyId":"f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","reversed":false}],"visiblePropertyIds":["20717ad3-5741-4416-83f1-6f133fff3d11","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By Sprint","createAt":1643732964966,"updateAt":1643732964966,"deleteAt":0},{"id":"9320d640-cfd7-45f3-8c21-da02017ec05b","schema":1,"workspaceId":"0","parentId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","rootId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🍗","properties":{"20717ad3-5741-4416-83f1-6f133fff3d11":"1fdbb515-edd2-4af5-80fc-437ed2211a49","50117d52-bcc7-4750-82aa-831a351c44a0":"8c557f69-b0ed-46ec-83a3-8efab9d47ef5","60985f46-3e41-486e-8213-2b987440ea1c":"ed4a5340-460d-461b-8838-2c56e8ee59fe","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e":"cb8ecdac-38be-4d36-8712-c4d58cc8a8e9"},"contentOrder":[],"isTemplate":false},"title":"Icons don\'t display","createAt":1643732964966,"updateAt":1643732964966,"deleteAt":0},{"id":"b889886a-ff89-4e3d-80f6-529e671a3f98","schema":1,"workspaceId":"0","parentId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","rootId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","createdBy":"system","modifiedBy":"system","type":"card","fields":{"icon":"🚢","properties":{"20717ad3-5741-4416-83f1-6f133fff3d11":"6eea96c9-4c61-4968-8554-4b7537e8f748","50117d52-bcc7-4750-82aa-831a351c44a0":"ec6d2bc5-df2b-4f77-8479-e59ceb039946","60985f46-3e41-486e-8213-2b987440ea1c":"c01676ca-babf-4534-8be5-cce2287daa6c","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e":"e6a7f297-4440-4783-8ab3-3af5ba62ca11"},"contentOrder":[],"isTemplate":false},"title":"Import / Export","createAt":1643732964967,"updateAt":1643732964967,"deleteAt":0},{"id":"bbcd657a-a011-46d7-8705-ca948472f0e9","schema":1,"workspaceId":"0","parentId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","rootId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"table","sortOptions":[{"propertyId":"f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","reversed":false}],"visiblePropertyIds":["50117d52-bcc7-4750-82aa-831a351c44a0","20717ad3-5741-4416-83f1-6f133fff3d11","60985f46-3e41-486e-8213-2b987440ea1c","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[{"propertyId":"20717ad3-5741-4416-83f1-6f133fff3d11","condition":"includes","values":["6eea96c9-4c61-4968-8554-4b7537e8f748"]}]},"cardOrder":[],"columnWidths":{"__title":280},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Tasks 🔨","createAt":1643732964968,"updateAt":1643732964968,"deleteAt":0},{"id":"bc6ba4f3-457f-4cfd-8a99-ff6b075da0ab","schema":1,"workspaceId":"0","parentId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","rootId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"table","sortOptions":[{"propertyId":"60985f46-3e41-486e-8213-2b987440ea1c","reversed":false}],"visiblePropertyIds":["50117d52-bcc7-4750-82aa-831a351c44a0","20717ad3-5741-4416-83f1-6f133fff3d11","60985f46-3e41-486e-8213-2b987440ea1c","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[{"propertyId":"20717ad3-5741-4416-83f1-6f133fff3d11","condition":"includes","values":["424ea5e3-9aa1-4075-8c5c-01b44b66e634"]}]},"cardOrder":[],"columnWidths":{"__title":280},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Epics ⛰","createAt":1643732964968,"updateAt":1643732964968,"deleteAt":0},{"id":"c8f4580d-35b0-4331-87ac-c8168c5a86c9","schema":1,"workspaceId":"0","parentId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","rootId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"board","groupById":"50117d52-bcc7-4750-82aa-831a351c44a0","sortOptions":[{"propertyId":"f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","reversed":false}],"visiblePropertyIds":["20717ad3-5741-4416-83f1-6f133fff3d11","60985f46-3e41-486e-8213-2b987440ea1c","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":["9320d640-cfd7-45f3-8c21-da02017ec05b","b889886a-ff89-4e3d-80f6-529e671a3f98","5e6f15b1-22b8-4ef5-822a-ad223d21c200"],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By Status","createAt":1643732964969,"updateAt":1643732964969,"deleteAt":0},{"id":"e8c7e400-c4aa-427c-83e8-a471b5e812a8","schema":1,"workspaceId":"0","parentId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","rootId":"d7f8378d-8145-4c82-84d6-affbeb7fd7da","createdBy":"system","modifiedBy":"system","type":"view","fields":{"viewType":"board","groupById":"50117d52-bcc7-4750-82aa-831a351c44a0","sortOptions":[],"visiblePropertyIds":["f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","60985f46-3e41-486e-8213-2b987440ea1c"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[{"propertyId":"20717ad3-5741-4416-83f1-6f133fff3d11","condition":"includes","values":["6eea96c9-4c61-4968-8554-4b7537e8f748"]}]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Tasks by Status","createAt":1643732964970,"updateAt":1643732964970,"deleteAt":0},{"id":"7e0ada05-4b81-4dda-80d6-f5505fec8d6b","schema":1,"workspaceId":"0","parentId":"80119267-bbd7-44c7-8322-224e0cf2e768","rootId":"3fa520eb-30cd-4852-829a-ba3bc7e88e26","createdBy":"system","modifiedBy":"system","type":"text","fields":{},"title":"## Discussion items\\n* One\\n\\n\\n## Action items\\n* Item - owner","createAt":1643732964971,"updateAt":1643732964971,"deleteAt":0},{"id":"vk5d6td6tzpdfibtabuzjgwk88r","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","sortOptions":[],"visiblePropertyIds":[],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Board View","createAt":1643733258753,"updateAt":1643733303218,"deleteAt":0},{"id":"cyuidkfsy43rzubzfohx8demtcw","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🌳","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"dabadd9b-adf1-4d9f-8702-805ac6cef602"},"contentOrder":[],"isTemplate":false},"title":"Gardening","createAt":1643733258755,"updateAt":1643736454792,"deleteAt":0},{"id":"c53orcju38jggmcadh7ja74yp1a","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7"},"contentOrder":[],"isTemplate":true},"title":"New Task","createAt":1643733258757,"updateAt":1643733258757,"deleteAt":0},{"id":"ctf1jbxhgmi85bg67pdzusyebhw","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🐱","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"d37a61f4-f332-4db9-8b2d-5e0a91aa20ed"},"contentOrder":[],"isTemplate":false},"title":"Feed Fluffy","createAt":1643733258758,"updateAt":1643733262451,"deleteAt":0},{"id":"b3fs1cyw717nfjfswcyk9hd1jph","schema":1,"workspaceId":"0","parentId":"","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"board","fields":{"showDescription":false,"description":"","icon":"✔️","isTemplate":false,"columnCalculations":[],"cardProperties":[{"id":"d777ba3b-8728-40d1-87a6-59406bbbbfb0","name":"Status","type":"select","options":[{"color":"propColorPink","id":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7","value":"To Do"},{"color":"propColorYellow","id":"d37a61f4-f332-4db9-8b2d-5e0a91aa20ed","value":"Doing"},{"color":"propColorGreen","id":"dabadd9b-adf1-4d9f-8702-805ac6cef602","value":"Done 🙌"}]}]},"title":"Personal Tasks","createAt":1643733258760,"updateAt":1643736587752,"deleteAt":0},{"id":"cjoke918aqbrzu8a78onszkpipw","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"👣","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7"},"contentOrder":[],"isTemplate":false},"title":"Go for a walk","createAt":1643733258761,"updateAt":1643733258761,"deleteAt":0},{"id":"verxf89x1t7ycfmiagsrk15dpxa","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"table","sortOptions":[],"visiblePropertyIds":["d777ba3b-8728-40d1-87a6-59406bbbbfb0"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{"__title":280},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Table view","createAt":1643733306282,"updateAt":1643736459730,"deleteAt":0},{"id":"bqnj59ozbyfd1uyt8fqnbj1mque","schema":1,"workspaceId":"0","parentId":"","rootId":"bqnj59ozbyfd1uyt8fqnbj1mque","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"board","fields":{"showDescription":false,"description":"","icon":"","isTemplate":false,"columnCalculations":[],"cardProperties":[{"id":"a7zx6tgcdnbts98fuuprg4j97ea","name":"Status","type":"select","options":[{"color":"propColorDefault","id":"ap31tue6px7z5muummrajt9gcdy","value":"New group"}]}]},"title":"","createAt":1643736597727,"updateAt":1643736599215,"deleteAt":0},{"id":"viqtmyhdmhin3be9qaksuu64c6r","schema":1,"workspaceId":"0","parentId":"bqnj59ozbyfd1uyt8fqnbj1mque","rootId":"bqnj59ozbyfd1uyt8fqnbj1mque","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","sortOptions":[],"visiblePropertyIds":[],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Board view","createAt":1643736597728,"updateAt":1643736597728,"deleteAt":0},{"id":"cgjamojm6ujbr388box1rjqeiow","schema":1,"workspaceId":"0","parentId":"bk8sfmucbcjbadbwdufax6oj8mh","rootId":"bk8sfmucbcjbadbwdufax6oj8mh","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🎛️","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"dd7b3a79-eb2d-4935-8959-29059ad9573a","d3d682bf-e074-49d9-8df5-7320921c2d23":"87f59784-b859-4c24-8ebe-17c766e081dd"},"contentOrder":[],"isTemplate":false},"title":"Settings UX","createAt":1643736602216,"updateAt":1643736602216,"deleteAt":0},{"id":"c3saa8f8idjr6txzox9d467irmo","schema":1,"workspaceId":"0","parentId":"bk8sfmucbcjbadbwdufax6oj8mh","rootId":"bk8sfmucbcjbadbwdufax6oj8mh","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"447ecf41-df5d-42e1-89ab-714e675ea671","d3d682bf-e074-49d9-8df5-7320921c2d23":"87f59784-b859-4c24-8ebe-17c766e081dd"},"contentOrder":[],"isTemplate":true},"title":"Task","createAt":1643736602217,"updateAt":1643736602217,"deleteAt":0},{"id":"vnnm39o4a4bgkuxni5nimj8ktzy","schema":1,"workspaceId":"0","parentId":"bk8sfmucbcjbadbwdufax6oj8mh","rootId":"bk8sfmucbcjbadbwdufax6oj8mh","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","groupById":"d3d682bf-e074-49d9-8df5-7320921c2d23","sortOptions":[],"visiblePropertyIds":["d3d682bf-e074-49d9-8df5-7320921c2d23"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By Priority","createAt":1643736602218,"updateAt":1643736602218,"deleteAt":0},{"id":"bk8sfmucbcjbadbwdufax6oj8mh","schema":1,"workspaceId":"0","parentId":"","rootId":"bk8sfmucbcjbadbwdufax6oj8mh","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"board","fields":{"showDescription":false,"description":"","icon":"🎯","isTemplate":false,"columnCalculations":[],"cardProperties":[{"id":"a972dc7a-5f4c-45d2-8044-8c28c69717f1","name":"Status","type":"select","options":[{"color":"propColorDefault","id":"447ecf41-df5d-42e1-89ab-714e675ea671","value":"Next Up"},{"color":"propColorYellow","id":"dd7b3a79-eb2d-4935-8959-29059ad9573a","value":"In Progress"},{"color":"propColorGreen","id":"dd7ab2bd-9c76-4de9-80f8-517e16fd1851","value":"Completed  🙌"},{"color":"propColorBrown","id":"65e5c9a3-3baa-4f17-816c-2ab2ba73ded9","value":"Archived"}]},{"id":"d3d682bf-e074-49d9-8df5-7320921c2d23","name":"Priority","type":"select","options":[{"color":"propColorRed","id":"d3bfb50f-f569-4bad-8a3a-dd15c3f60101","value":"High 🔥"},{"color":"propColorYellow","id":"87f59784-b859-4c24-8ebe-17c766e081dd","value":"Medium"},{"color":"propColorGray","id":"98a57627-0f76-471d-850d-91f3ed9fd213","value":"Low"}]},{"id":"2a5da320-735c-4093-8787-f56e15cdfeed","name":"Date Created","type":"createdTime","options":[]}]},"title":"Project Tasks","createAt":1643736602220,"updateAt":1643736602220,"deleteAt":0},{"id":"cqpg4e3e4e78mjgrdsxc8ikdsww","schema":1,"workspaceId":"0","parentId":"bk8sfmucbcjbadbwdufax6oj8mh","rootId":"bk8sfmucbcjbadbwdufax6oj8mh","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"💽","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"447ecf41-df5d-42e1-89ab-714e675ea671","d3d682bf-e074-49d9-8df5-7320921c2d23":"d3bfb50f-f569-4bad-8a3a-dd15c3f60101"},"contentOrder":[],"isTemplate":false},"title":"Database Schema","createAt":1643736602221,"updateAt":1643736602221,"deleteAt":0},{"id":"vuoidg7nsdpfotc8u59jdqwwu3o","schema":1,"workspaceId":"0","parentId":"bk8sfmucbcjbadbwdufax6oj8mh","rootId":"bk8sfmucbcjbadbwdufax6oj8mh","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"table","sortOptions":[],"visiblePropertyIds":["a972dc7a-5f4c-45d2-8044-8c28c69717f1","d3d682bf-e074-49d9-8df5-7320921c2d23","2a5da320-735c-4093-8787-f56e15cdfeed"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{"2a5da320-735c-4093-8787-f56e15cdfeed":179,"__title":280,"a972dc7a-5f4c-45d2-8044-8c28c69717f1":122,"d3d682bf-e074-49d9-8df5-7320921c2d23":110},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"All Tasks","createAt":1643736602222,"updateAt":1643736602222,"deleteAt":0},{"id":"vtyg9yzujnpr38bfsiehrx316bc","schema":1,"workspaceId":"0","parentId":"bk8sfmucbcjbadbwdufax6oj8mh","rootId":"bk8sfmucbcjbadbwdufax6oj8mh","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","groupById":"a972dc7a-5f4c-45d2-8044-8c28c69717f1","sortOptions":[],"visiblePropertyIds":[],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By Status","createAt":1643736602225,"updateAt":1643736602225,"deleteAt":0},{"id":"co3teai9bmtd4ud74mc7rkmgnze","schema":1,"workspaceId":"0","parentId":"bk8sfmucbcjbadbwdufax6oj8mh","rootId":"bk8sfmucbcjbadbwdufax6oj8mh","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🌴","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"447ecf41-df5d-42e1-89ab-714e675ea671","d3d682bf-e074-49d9-8df5-7320921c2d23":"87f59784-b859-4c24-8ebe-17c766e081dd"},"contentOrder":[],"isTemplate":false},"title":"API Layer","createAt":1643736602226,"updateAt":1643736602226,"deleteAt":0},{"id":"c1hcg3mch1bb7zy487g71mffp1e","schema":1,"workspaceId":"0","parentId":"bisms45oprbg8pfp9p3f4k5jm1h","rootId":"bisms45oprbg8pfp9p3f4k5jm1h","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🎛️","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"dd7b3a79-eb2d-4935-8959-29059ad9573a","d3d682bf-e074-49d9-8df5-7320921c2d23":"87f59784-b859-4c24-8ebe-17c766e081dd"},"contentOrder":[],"isTemplate":false},"title":"Settings UX","createAt":1643736612757,"updateAt":1643736612757,"deleteAt":0},{"id":"chse7opt9f3no8rn5ypxi1yqzcw","schema":1,"workspaceId":"0","parentId":"bisms45oprbg8pfp9p3f4k5jm1h","rootId":"bisms45oprbg8pfp9p3f4k5jm1h","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"447ecf41-df5d-42e1-89ab-714e675ea671","d3d682bf-e074-49d9-8df5-7320921c2d23":"87f59784-b859-4c24-8ebe-17c766e081dd"},"contentOrder":[],"isTemplate":true},"title":"Task","createAt":1643736612758,"updateAt":1643736612758,"deleteAt":0},{"id":"vpkzcsdngp789xx6df5kck4gyqe","schema":1,"workspaceId":"0","parentId":"bisms45oprbg8pfp9p3f4k5jm1h","rootId":"bisms45oprbg8pfp9p3f4k5jm1h","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","groupById":"d3d682bf-e074-49d9-8df5-7320921c2d23","sortOptions":[],"visiblePropertyIds":["d3d682bf-e074-49d9-8df5-7320921c2d23"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By Priority","createAt":1643736612760,"updateAt":1643736612760,"deleteAt":0},{"id":"bisms45oprbg8pfp9p3f4k5jm1h","schema":1,"workspaceId":"0","parentId":"","rootId":"bisms45oprbg8pfp9p3f4k5jm1h","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"board","fields":{"showDescription":false,"description":"","icon":"🎯","isTemplate":false,"columnCalculations":[],"cardProperties":[{"id":"a972dc7a-5f4c-45d2-8044-8c28c69717f1","name":"Status","type":"select","options":[{"color":"propColorDefault","id":"447ecf41-df5d-42e1-89ab-714e675ea671","value":"Next Up"},{"color":"propColorYellow","id":"dd7b3a79-eb2d-4935-8959-29059ad9573a","value":"In Progress"},{"color":"propColorGreen","id":"dd7ab2bd-9c76-4de9-80f8-517e16fd1851","value":"Completed  🙌"},{"color":"propColorBrown","id":"65e5c9a3-3baa-4f17-816c-2ab2ba73ded9","value":"Archived"}]},{"id":"d3d682bf-e074-49d9-8df5-7320921c2d23","name":"Priority","type":"select","options":[{"color":"propColorRed","id":"d3bfb50f-f569-4bad-8a3a-dd15c3f60101","value":"High 🔥"},{"color":"propColorYellow","id":"87f59784-b859-4c24-8ebe-17c766e081dd","value":"Medium"},{"color":"propColorGray","id":"98a57627-0f76-471d-850d-91f3ed9fd213","value":"Low"}]},{"id":"2a5da320-735c-4093-8787-f56e15cdfeed","name":"Date Created","type":"createdTime","options":[]}]},"title":"Project Tasks","createAt":1643736612761,"updateAt":1643736612761,"deleteAt":0},{"id":"czuzkodrk7ig1ukyb65s5ihdfyc","schema":1,"workspaceId":"0","parentId":"bisms45oprbg8pfp9p3f4k5jm1h","rootId":"bisms45oprbg8pfp9p3f4k5jm1h","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"💽","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"447ecf41-df5d-42e1-89ab-714e675ea671","d3d682bf-e074-49d9-8df5-7320921c2d23":"d3bfb50f-f569-4bad-8a3a-dd15c3f60101"},"contentOrder":[],"isTemplate":false},"title":"Database Schema","createAt":1643736612763,"updateAt":1643736612763,"deleteAt":0},{"id":"vsh7w1npzcpdd8yj66ne8od9xsa","schema":1,"workspaceId":"0","parentId":"bisms45oprbg8pfp9p3f4k5jm1h","rootId":"bisms45oprbg8pfp9p3f4k5jm1h","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"table","sortOptions":[],"visiblePropertyIds":["a972dc7a-5f4c-45d2-8044-8c28c69717f1","d3d682bf-e074-49d9-8df5-7320921c2d23","2a5da320-735c-4093-8787-f56e15cdfeed"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{"2a5da320-735c-4093-8787-f56e15cdfeed":179,"__title":280,"a972dc7a-5f4c-45d2-8044-8c28c69717f1":122,"d3d682bf-e074-49d9-8df5-7320921c2d23":110},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"All Tasks","createAt":1643736612764,"updateAt":1643736612764,"deleteAt":0},{"id":"vz41y64ysn7fj9njuuctnycxreo","schema":1,"workspaceId":"0","parentId":"bisms45oprbg8pfp9p3f4k5jm1h","rootId":"bisms45oprbg8pfp9p3f4k5jm1h","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","groupById":"a972dc7a-5f4c-45d2-8044-8c28c69717f1","sortOptions":[],"visiblePropertyIds":[],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By Status","createAt":1643736612766,"updateAt":1643736612766,"deleteAt":0},{"id":"csiedjzksnby35jjte4h8c1h7fy","schema":1,"workspaceId":"0","parentId":"bisms45oprbg8pfp9p3f4k5jm1h","rootId":"bisms45oprbg8pfp9p3f4k5jm1h","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🌴","properties":{"a972dc7a-5f4c-45d2-8044-8c28c69717f1":"447ecf41-df5d-42e1-89ab-714e675ea671","d3d682bf-e074-49d9-8df5-7320921c2d23":"87f59784-b859-4c24-8ebe-17c766e081dd"},"contentOrder":[],"isTemplate":false},"title":"API Layer","createAt":1643736612767,"updateAt":1643736612767,"deleteAt":0},{"id":"bmgab4bhsfbn7brky5j3ccnuyyy","schema":1,"workspaceId":"0","parentId":"","rootId":"bmgab4bhsfbn7brky5j3ccnuyyy","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"board","fields":{"showDescription":false,"description":"","icon":"🗒️","isTemplate":false,"columnCalculations":[],"cardProperties":[{"id":"7c212e78-9345-4c60-81b5-0b0e37ce463f","name":"Type","type":"select","options":[{"color":"propColorYellow","id":"31da50ca-f1a9-4d21-8636-17dc387c1a23","value":"Ad Hoc"},{"color":"propColorBlue","id":"def6317c-ec11-410d-8a6b-ea461320f392","value":"Standup"},{"color":"propColorPurple","id":"700f83f8-6a41-46cd-87e2-53e0d0b12cc7","value":"Weekly Sync"}]},{"id":"13d2394a-eb5e-4f22-8c22-6515ec41c4a4","name":"Summary","type":"text","options":[]}]},"title":"Meeting Notes","createAt":1643736619991,"updateAt":1643736619991,"deleteAt":0},{"id":"axaqk57mt9fbtpdimruegmd3ozy","schema":1,"workspaceId":"0","parentId":"c1oym6xzd33yk3ngn8fq553a9dh","rootId":"bmgab4bhsfbn7brky5j3ccnuyyy","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"text","fields":{},"title":"# Discussion items\\n* One\\n1. \\n2. \\n3. \\n\\n\\n## Action items\\n* Item - owner","createAt":1643736619992,"updateAt":1643791011463,"deleteAt":0},{"id":"c1oym6xzd33yk3ngn8fq553a9dh","schema":1,"workspaceId":"0","parentId":"bmgab4bhsfbn7brky5j3ccnuyyy","rootId":"bmgab4bhsfbn7brky5j3ccnuyyy","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🎻","properties":{"13d2394a-eb5e-4f22-8c22-6515ec41c4a4":"Green light!","7c212e78-9345-4c60-81b5-0b0e37ce463f":"def6317c-ec11-410d-8a6b-ea461320f392"},"contentOrder":["axaqk57mt9fbtpdimruegmd3ozy"],"isTemplate":false},"title":"Nov 2","createAt":1643736619994,"updateAt":1643736619994,"deleteAt":0},{"id":"vmhzatz5h8bd9pkjftdhodww5mc","schema":1,"workspaceId":"0","parentId":"bmgab4bhsfbn7brky5j3ccnuyyy","rootId":"bmgab4bhsfbn7brky5j3ccnuyyy","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","groupById":"7c212e78-9345-4c60-81b5-0b0e37ce463f","sortOptions":[],"visiblePropertyIds":["13d2394a-eb5e-4f22-8c22-6515ec41c4a4"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":["c57n7sor8y7bd7k3cetmgmdwhdy"],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By type","createAt":1643736619995,"updateAt":1643782661900,"deleteAt":0},{"id":"viu9m3r1mi7rimriqq1e35yqa1r","schema":1,"workspaceId":"0","parentId":"bmgab4bhsfbn7brky5j3ccnuyyy","rootId":"bmgab4bhsfbn7brky5j3ccnuyyy","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"table","sortOptions":[],"visiblePropertyIds":["7c212e78-9345-4c60-81b5-0b0e37ce463f","13d2394a-eb5e-4f22-8c22-6515ec41c4a4"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{"13d2394a-eb5e-4f22-8c22-6515ec41c4a4":622,"7c212e78-9345-4c60-81b5-0b0e37ce463f":135,"__title":280},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Table view","createAt":1643736619997,"updateAt":1643790973630,"deleteAt":0},{"id":"vd4jazpxoi7brtc5dhyh65m6zna","schema":1,"workspaceId":"0","parentId":"bmkxumrb4q3r7b8tzxnkzp4fhow","rootId":"bmkxumrb4q3r7b8tzxnkzp4fhow","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"table","sortOptions":[{"propertyId":"f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","reversed":false}],"visiblePropertyIds":["50117d52-bcc7-4750-82aa-831a351c44a0","20717ad3-5741-4416-83f1-6f133fff3d11","60985f46-3e41-486e-8213-2b987440ea1c","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[{"propertyId":"20717ad3-5741-4416-83f1-6f133fff3d11","condition":"includes","values":["1fdbb515-edd2-4af5-80fc-437ed2211a49"]}]},"cardOrder":[],"columnWidths":{"__title":280},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Bugs 🐞","createAt":1643736630443,"updateAt":1643736736365,"deleteAt":0},{"id":"ccb8s3zmc37yt5qwzo7s1ofhmzy","schema":1,"workspaceId":"0","parentId":"bmkxumrb4q3r7b8tzxnkzp4fhow","rootId":"bmkxumrb4q3r7b8tzxnkzp4fhow","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🛣️","properties":{"20717ad3-5741-4416-83f1-6f133fff3d11":"424ea5e3-9aa1-4075-8c5c-01b44b66e634","50117d52-bcc7-4750-82aa-831a351c44a0":"8c557f69-b0ed-46ec-83a3-8efab9d47ef5","60985f46-3e41-486e-8213-2b987440ea1c":"14892380-1a32-42dd-8034-a0cea32bc7e6","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e":"e6a7f297-4440-4783-8ab3-3af5ba62ca11"},"contentOrder":[],"isTemplate":false},"title":"Review API design","createAt":1643736630445,"updateAt":1643736630445,"deleteAt":0},{"id":"vs8uecutitjnziqs4jpobkssupc","schema":1,"workspaceId":"0","parentId":"bmkxumrb4q3r7b8tzxnkzp4fhow","rootId":"bmkxumrb4q3r7b8tzxnkzp4fhow","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","groupById":"60985f46-3e41-486e-8213-2b987440ea1c","sortOptions":[{"propertyId":"f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","reversed":false}],"visiblePropertyIds":["20717ad3-5741-4416-83f1-6f133fff3d11","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By Sprint","createAt":1643736630446,"updateAt":1643736630446,"deleteAt":0},{"id":"c6zfdzuoctbyd7px5c7hck5sqac","schema":1,"workspaceId":"0","parentId":"bmkxumrb4q3r7b8tzxnkzp4fhow","rootId":"bmkxumrb4q3r7b8tzxnkzp4fhow","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🍗","properties":{"20717ad3-5741-4416-83f1-6f133fff3d11":"1fdbb515-edd2-4af5-80fc-437ed2211a49","50117d52-bcc7-4750-82aa-831a351c44a0":"8c557f69-b0ed-46ec-83a3-8efab9d47ef5","60985f46-3e41-486e-8213-2b987440ea1c":"ed4a5340-460d-461b-8838-2c56e8ee59fe","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e":"cb8ecdac-38be-4d36-8712-c4d58cc8a8e9"},"contentOrder":[],"isTemplate":false},"title":"Icons don\'t display","createAt":1643736630448,"updateAt":1643736667481,"deleteAt":0},{"id":"chpdsojsfrfbdtjfuics9btag5h","schema":1,"workspaceId":"0","parentId":"bmkxumrb4q3r7b8tzxnkzp4fhow","rootId":"bmkxumrb4q3r7b8tzxnkzp4fhow","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🚢","properties":{"20717ad3-5741-4416-83f1-6f133fff3d11":"6eea96c9-4c61-4968-8554-4b7537e8f748","50117d52-bcc7-4750-82aa-831a351c44a0":"ec6d2bc5-df2b-4f77-8479-e59ceb039946","60985f46-3e41-486e-8213-2b987440ea1c":"c01676ca-babf-4534-8be5-cce2287daa6c","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e":"e6a7f297-4440-4783-8ab3-3af5ba62ca11"},"contentOrder":[],"isTemplate":false},"title":"Import / Export","createAt":1643736630449,"updateAt":1643736630449,"deleteAt":0},{"id":"v4158aek58frtuq3e753gycuopa","schema":1,"workspaceId":"0","parentId":"bmkxumrb4q3r7b8tzxnkzp4fhow","rootId":"bmkxumrb4q3r7b8tzxnkzp4fhow","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"table","sortOptions":[{"propertyId":"f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","reversed":false}],"visiblePropertyIds":["50117d52-bcc7-4750-82aa-831a351c44a0","20717ad3-5741-4416-83f1-6f133fff3d11","60985f46-3e41-486e-8213-2b987440ea1c","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[{"propertyId":"20717ad3-5741-4416-83f1-6f133fff3d11","condition":"includes","values":["6eea96c9-4c61-4968-8554-4b7537e8f748"]}]},"cardOrder":[],"columnWidths":{"__title":280},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Tasks 🔨","createAt":1643736630450,"updateAt":1643736630450,"deleteAt":0},{"id":"vbkmber1yffyjinbxg9xhe4ge9o","schema":1,"workspaceId":"0","parentId":"bmkxumrb4q3r7b8tzxnkzp4fhow","rootId":"bmkxumrb4q3r7b8tzxnkzp4fhow","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"table","sortOptions":[{"propertyId":"60985f46-3e41-486e-8213-2b987440ea1c","reversed":false}],"visiblePropertyIds":["50117d52-bcc7-4750-82aa-831a351c44a0","20717ad3-5741-4416-83f1-6f133fff3d11","60985f46-3e41-486e-8213-2b987440ea1c","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[{"propertyId":"20717ad3-5741-4416-83f1-6f133fff3d11","condition":"includes","values":["424ea5e3-9aa1-4075-8c5c-01b44b66e634"]}]},"cardOrder":[],"columnWidths":{"__title":280},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Epics ⛰","createAt":1643736630451,"updateAt":1643736630451,"deleteAt":0},{"id":"vfay19rd6bpnjmgyjxk58hbughc","schema":1,"workspaceId":"0","parentId":"bmkxumrb4q3r7b8tzxnkzp4fhow","rootId":"bmkxumrb4q3r7b8tzxnkzp4fhow","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","groupById":"50117d52-bcc7-4750-82aa-831a351c44a0","sortOptions":[{"propertyId":"f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","reversed":false}],"visiblePropertyIds":["20717ad3-5741-4416-83f1-6f133fff3d11","60985f46-3e41-486e-8213-2b987440ea1c","f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":["ct1hpbmebpxgy7ycirxkge1io1h","c8dzzkzx54y17p6tm65qfsi3zfy","ceh46t4rbndpznp9ot6cgopcqow"],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"By Status","createAt":1643736630452,"updateAt":1643736630452,"deleteAt":0},{"id":"bmkxumrb4q3r7b8tzxnkzp4fhow","schema":1,"workspaceId":"0","parentId":"","rootId":"bmkxumrb4q3r7b8tzxnkzp4fhow","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"board","fields":{"showDescription":false,"description":"","icon":"🥰","isTemplate":false,"columnCalculations":[],"cardProperties":[{"id":"50117d52-bcc7-4750-82aa-831a351c44a0","name":"Status","type":"select","options":[{"color":"propColorDefault","id":"8c557f69-b0ed-46ec-83a3-8efab9d47ef5","value":"Not Started"},{"color":"propColorYellow","id":"ec6d2bc5-df2b-4f77-8479-e59ceb039946","value":"In Progress"},{"color":"propColorGreen","id":"849766ba-56a5-48d1-886f-21672f415395","value":"Complete 🙌"}]},{"id":"20717ad3-5741-4416-83f1-6f133fff3d11","name":"Type","type":"select","options":[{"color":"propColorYellow","id":"424ea5e3-9aa1-4075-8c5c-01b44b66e634","value":"Epic ⛰"},{"color":"propColorGreen","id":"6eea96c9-4c61-4968-8554-4b7537e8f748","value":"Task 🔨"},{"color":"propColorRed","id":"1fdbb515-edd2-4af5-80fc-437ed2211a49","value":"Bug 🐞"}]},{"id":"60985f46-3e41-486e-8213-2b987440ea1c","name":"Sprint","type":"select","options":[{"color":"propColorDefault","id":"c01676ca-babf-4534-8be5-cce2287daa6c","value":"Sprint 1"},{"color":"propColorDefault","id":"ed4a5340-460d-461b-8838-2c56e8ee59fe","value":"Sprint 2"},{"color":"propColorDefault","id":"14892380-1a32-42dd-8034-a0cea32bc7e6","value":"Sprint 3"}]},{"id":"f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","name":"Priority","type":"select","options":[{"color":"propColorRed","id":"cb8ecdac-38be-4d36-8712-c4d58cc8a8e9","value":"P1 🔥"},{"color":"propColorYellow","id":"e6a7f297-4440-4783-8ab3-3af5ba62ca11","value":"P2"},{"color":"propColorGray","id":"c62172ea-5da7-4dec-8186-37267d8ee9a7","value":"P3"}]}]},"title":"Roadmap","createAt":1643736630453,"updateAt":1643745304183,"deleteAt":0},{"id":"vcksjecfc93y9jkkc4o6pcr56ky","schema":1,"workspaceId":"0","parentId":"bmkxumrb4q3r7b8tzxnkzp4fhow","rootId":"bmkxumrb4q3r7b8tzxnkzp4fhow","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","groupById":"50117d52-bcc7-4750-82aa-831a351c44a0","sortOptions":[],"visiblePropertyIds":["f7f3ad42-b31a-4ac2-81f0-28ea80c5b34e","60985f46-3e41-486e-8213-2b987440ea1c"],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[{"propertyId":"20717ad3-5741-4416-83f1-6f133fff3d11","condition":"includes","values":["6eea96c9-4c61-4968-8554-4b7537e8f748"]}]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Tasks by Status","createAt":1643736630455,"updateAt":1643736630455,"deleteAt":0},{"id":"c57n7sor8y7bd7k3cetmgmdwhdy","schema":1,"workspaceId":"0","parentId":"bmgab4bhsfbn7brky5j3ccnuyyy","rootId":"bmgab4bhsfbn7brky5j3ccnuyyy","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"","properties":{"7c212e78-9345-4c60-81b5-0b0e37ce463f":"31da50ca-f1a9-4d21-8636-17dc387c1a23"},"contentOrder":[],"isTemplate":false},"title":"camera","createAt":1643782636848,"updateAt":1643782650552,"deleteAt":0},{"id":"bmmsfodopzffmjjetz8xprzomac","schema":1,"workspaceId":"0","parentId":"","rootId":"bmmsfodopzffmjjetz8xprzomac","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"board","fields":{"showDescription":false,"description":"","icon":"","isTemplate":false,"columnCalculations":[],"cardProperties":[{"id":"acmhwc8jemme6aeh5bpc6x8ki5c","name":"Status","type":"select","options":[]}]},"title":"","createAt":1643824754696,"updateAt":1643824754695,"deleteAt":0},{"id":"vxpafbzuzjpr63ymdt15gzsa39o","schema":1,"workspaceId":"0","parentId":"bmmsfodopzffmjjetz8xprzomac","rootId":"bmmsfodopzffmjjetz8xprzomac","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","sortOptions":[],"visiblePropertyIds":[],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Board view","createAt":1643824754706,"updateAt":1643824754706,"deleteAt":0}]');
