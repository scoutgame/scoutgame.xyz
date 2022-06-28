import { Prisma, Space } from '@prisma/client';
import { PageContent } from 'models';
import { v4 as uuid } from 'uuid';

export const spaces: Space[] = [
  { id: '0', name: 'Our Community', domain: 'demo' },
  { id: '1', name: 'My Workspace', domain: 'my-workspace' }
].map(space => MockSpace(space));

function MockSpace (partial: Partial<Space>): Space {
  return {
    discordServerId: null,
    id: uuid(),
    domain: '',
    name: '',
    spaceImage: '',
    createdAt: new Date(),
    createdBy: '0x87ddfh6g435D12CE393aBbA3f81fe6C594543sdw',
    deletedAt: null,
    updatedAt: new Date(),
    updatedBy: '0x87ddfh6g435D12CE393aBbA3f81fe6C594543sdw',
    snapshotDomain: null,
    defaultVotingDuration: null,
    defaultPagePermissionGroup: null,
    defaultPublicPages: false,
    permissionConfigurationMode: 'custom',
    ...partial
  };
}

export function untitledPage ({ userId, spaceId }: {userId: string, spaceId: string}): Prisma.PageCreateInput {
  return {
    author: { connect: { id: userId } },
    autoGenerated: true,
    content: {
      type: 'doc',
      content: []
    },
    contentText: '',
    path: uuid(),
    title: '',
    type: 'page',
    updatedAt: new Date(),
    updatedBy: userId,
    space: { connect: { id: spaceId } }
  };
}

export function gettingStartedPageContent (): PageContent {
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
                    text: ' for inserting emojis.'
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
            text: 'Getting started with CharmVerse'
          }
        ]
      },
      {
        type: 'iframe',
        attrs: {
          src: 'https://tiny.charmverse.io/productdemo',
          width: 700,
          height: 451.9774011299435,
          type: 'video'
        }
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
            text: 'Inviting others'
          }
        ]
      },
      {
        type: 'iframe',
        attrs: {
          src: 'https://tiny.charmverse.io/invites',
          width: 700,
          height: 451.9774011299435,
          type: 'video'
        }
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
                      href: 'https://discord.gg/ACYCzBGC2M'
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

export const blocks = JSON.parse('[{"id":"vk5d6td6tzpdfibtabuzjgwk88r","schema":1,"parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","updatedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","sortOptions":[],"visiblePropertyIds":[],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":["ctf1jbxhgmi85bg67pdzusyebhw","cjoke918aqbrzu8a78onszkpipw","7s14ecncef7apnhpc7jpmmac1sh","cyuidkfsy43rzubzfohx8demtcw","71ffp1rss8b9z1mej8t8gomdxeo"],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Board View","createAt":1643733258753,"updateAt":1643733303218,"deletedAt":0},{"id":"cyuidkfsy43rzubzfohx8demtcw","schema":1,"parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","updatedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🌳","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"dabadd9b-adf1-4d9f-8702-805ac6cef602"},"contentOrder":[],"isTemplate":false},"title":"Gardening","createAt":1643733258755,"updateAt":1643736454792,"deletedAt":0},{"id":"c53orcju38jggmcadh7ja74yp1a","schema":1,"parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","updatedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7"},"contentOrder":[],"isTemplate":true},"title":"New Task","createAt":1643733258757,"updateAt":1643733258757,"deletedAt":0},{"id":"ctf1jbxhgmi85bg67pdzusyebhw","schema":1,"parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","updatedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🐱","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"d37a61f4-f332-4db9-8b2d-5e0a91aa20ed"},"contentOrder":[],"isTemplate":false},"title":"Feed Fluffy","createAt":1643733258758,"updateAt":1643733262451,"deletedAt":0},{"id":"b3fs1cyw717nfjfswcyk9hd1jph","schema":1,"parentId":"","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","updatedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"board","fields":{"showDescription":false,"description":"","icon":"😄","isTemplate":false,"columnCalculations":[],"cardProperties":[{"id":"d777ba3b-8728-40d1-87a6-59406bbbbfb0","name":"Status","type":"select","options":[{"color":"propColorPink","id":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7","value":"To Do!!"},{"color":"propColorYellow","id":"d37a61f4-f332-4db9-8b2d-5e0a91aa20ed","value":"Doing"},{"color":"propColorTeal","id":"dabadd9b-adf1-4d9f-8702-805ac6cef602","value":"Done 🙌"}]}]},"title":"Personal Tasks","createAt":1643733258760,"updateAt":1643736587752,"deletedAt":0},{"id":"cjoke918aqbrzu8a78onszkpipw","schema":1,"parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","updatedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"👣","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7"},"contentOrder":[],"isTemplate":false},"title":"Go for a walk","createAt":1643733258761,"updateAt":1643733258761,"deletedAt":0}]')
  .map((b: object) => ({
    ...b,
    spaceId: spaces[0].id
  }));
