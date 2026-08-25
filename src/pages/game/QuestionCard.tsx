import { Box, Text } from '@chakra-ui/react'

export function QuestionCard({ question }: { question: string }) {
  return (
    <Box
      w="full"
      maxW={{ base: '260px', md: '300px' }}
      minH={{ base: '340px', md: '380px' }}
      mx="auto"
      borderRadius="22px"
      px="6"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="cardFace"
      boxShadow="xl"
    >
      <Text
        color="fg.onCard"
        fontSize={{ base: 'xl', md: '2xl' }}
        fontWeight="semibold"
        lineHeight="relaxed"
        textAlign="center"
      >
        {question}
      </Text>
    </Box>
  )
}