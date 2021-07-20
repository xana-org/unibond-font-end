import { useEffect }            from "react";
import { useRouter }            from "next/router";
import { Box }                  from "@chakra-ui/core";
import useDidMount              from "../../hooks/useDidMount";
import { scrollToPosition }     from "../../lib/scroll";
import Header                   from "../Header";

const Layout = ({ children }) => {
    const didMount = useDidMount();
    const router = useRouter();
    const { asPath } = router;

    /**
     * Scroll to top on each route change using `asPath` (resolved path),
     * not `pathname` (may be a dynamic route).
     */
    useEffect(() => {
      if (didMount) {
        scrollToPosition();
      }
    }, [asPath]);
  
  
    return (
        <Box w="100%" bg="#000%" color="#fff">
            <Header/>
            <Box overflowY="auto" w="100%">
              {children}              
            </Box>
        </Box>
    );
  };
  
  export default Layout;