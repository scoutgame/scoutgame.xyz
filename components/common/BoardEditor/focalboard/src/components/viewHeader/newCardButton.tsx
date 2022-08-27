
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { BoardView } from '../../blocks/boardView';
import { Card } from '../../blocks/card';
import { getCurrentBoardTemplates } from '../../store/cards';
import { useAppSelector } from '../../store/hooks';
import ButtonWithMenu from '../../widgets/buttons/buttonWithMenu';
import Menu from '../../widgets/menu';
import EmptyCardButton from './emptyCardButton';

type Props = {
    addCard: () => void
    // addCardFromTemplate: (cardTemplateId: string) => void
    addCardTemplate: () => void
    editCardTemplate: (cardTemplateId: string) => void
    view: BoardView
}

const NewCardButton = React.memo((props: Props): JSX.Element => {
  const cardTemplates: Card[] = useAppSelector(getCurrentBoardTemplates);
  const currentView = props.view;

  return (
    <ButtonWithMenu
      onClick={() => {
        if (currentView.fields.defaultTemplateId) {
          // props.addCardFromTemplate(currentView.fields.defaultTemplateId)
        }
        else {
          props.addCard();
        }
      }}
      text={(
        <FormattedMessage
          id='ViewHeader.new'
          defaultMessage='New'
        />
      )}
    >
      <Menu position='bottom-end'>
        {cardTemplates.length > 0 && (
          <>
            <Menu.Label>
              <b>
                <FormattedMessage
                  id='ViewHeader.select-a-template'
                  defaultMessage='Select a template'
                />
              </b>
            </Menu.Label>

            <Menu.Separator />
          </>
        )}
        {/** TODO: Add support for templates */}
        {/* {cardTemplates.map((cardTemplate) => (
                    <NewCardButtonTemplateItem
                        key={cardTemplate.id}
                        view={currentView}
                        cardTemplate={cardTemplate}
                        addCardFromTemplate={props.addCardFromTemplate}
                        editCardTemplate={props.editCardTemplate}
                    />
                ))} */}

        <EmptyCardButton
          addCard={props.addCard}
          view={currentView}
        />

        {/* <Menu.Text
                    icon={<AddIcon/>}
                    id='add-template'
                    name={intl.formatMessage({id: 'ViewHeader.add-template', defaultMessage: 'New template'})}
                    onClick={() => props.addCardTemplate()}
                /> */}
      </Menu>
    </ButtonWithMenu>
  );
});

export default NewCardButton;
