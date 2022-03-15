import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { PaymentMethod } from '@prisma/client';
import { StyledRow } from 'components/settings/TokenGatesTable';
import { getDisplayName } from 'lib/users';
import { PaymentMethodMap } from 'hooks/usePaymentMethods';
import { getChainById, getChainExplorerLink } from 'connectors';
import { useUser } from 'hooks/useUser';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import { CompositeDeletePaymentMethod } from './CompositeDeletePaymentMethodModal';

interface IProps {
  paymentMethods: PaymentMethodMap
}

export function CompositePaymentMethodList ({ paymentMethods }: IProps) {

  const [user] = useUser();
  const [paymentMethodIdToDelete, setPaymentMethodIdToDelete] = useState<string | null>(null);

  const isAdmin = user?.spaceRoles.some(spaceRole => spaceRole.role === 'admin') === true;

  const flattenedPaymentMethods = Object.values(paymentMethods).reduce((list, chainPaymentMethods) => {
    list.push(...chainPaymentMethods);
    return list;
  }, [])
    .sort((methodA, methodB) => {
      if (methodA.chainId < methodB.chainId) {
        return -1;
      }
      else if (methodA.chainId > methodB.chainId) {
        return 1;
      }
      else {
        return 0;
      }
    });

  return (

    <>
      <CompositeDeletePaymentMethod
        open={paymentMethodIdToDelete !== null}
        paymentMethodIdToDelete={paymentMethodIdToDelete as string}
        onClose={() => {
          setPaymentMethodIdToDelete(null);
        }}
      />

      <Table size='small' aria-label='simple table'>
        <TableHead>
          <TableRow>

            <TableCell>Symbol</TableCell>
            <TableCell>{/* Logo */}</TableCell>
            <TableCell>Name</TableCell>
            <TableCell sx={{ px: 0 }}>Blockchain</TableCell>

            <TableCell>{/* Delete */}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {flattenedPaymentMethods.map((row) => (
            <StyledRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>

              <TableCell width={100}>
                <Typography>
                  {row.tokenSymbol}
                </Typography>
              </TableCell>
              <TableCell width={80}>
                {
                row.tokenLogo && (
                  <img
                    alt=''
                    style={{ maxHeight: '50px' }}
                    src={row.tokenLogo as string}
                  />
                )
              }
              </TableCell>
              <TableCell width={300}>
                <Box component='span' sx={{ display: 'inline' }}>

                  <Typography>
                    {row.tokenName}

                  </Typography>

                </Box>

              </TableCell>
              <TableCell width={200} sx={{ px: 0 }}>
                <Typography>
                  <a href={getChainExplorerLink(row.chainId, row.contractAddress, 'token')} target='_blank' rel='noreferrer'>
                    <LaunchIcon sx={{ mr: 1 }} />
                  </a>
                  <strong>{getChainById(row.chainId)?.chainName}</strong>
                </Typography>
              </TableCell>
              <TableCell width={150} sx={{ px: 0 }} align='center'>

                {
                isAdmin && (
                  <DeleteIcon
                    onClick={() => {
                      setPaymentMethodIdToDelete(row.contractAddress);
                    }}
                    fontSize='small'
                  />
                )
              }
              </TableCell>
            </StyledRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
